/**
 * @fileoverview WebSocket transport implementation for JSON-RPC communication.
 *
 * @module WebSocketTransport
 * @since 0.0.1
 *
 * @description
 * Provides a WebSocket-based transport layer for communicating with Ethereum
 * JSON-RPC endpoints. Ideal for real-time subscriptions and high-frequency
 * requests due to persistent connection.
 *
 * Features:
 * - Persistent connection (no connection overhead per request)
 * - Automatic request/response correlation via JSON-RPC IDs
 * - Connection lifecycle management with Effect scoping
 * - Automatic cleanup when scope closes
 * - Timeout handling for individual requests
 * - Automatic reconnection with exponential backoff
 * - Keep-alive pings
 * - Request queuing during reconnection
 *
 * Use WebSocket transport when:
 * - You need eth_subscribe for real-time events
 * - Making many requests in quick succession
 * - Low latency is critical
 *
 * @see {@link TransportService} - The service interface this implements
 * @see {@link HttpTransport} - Alternative for standard request/response
 * @see {@link BrowserTransport} - Alternative for browser wallet interaction
 */

import * as Socket from "@effect/platform/Socket";
import * as Deferred from "effect/Deferred";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as FiberRef from "effect/FiberRef";
import * as Layer from "effect/Layer";
import * as Ref from "effect/Ref";
import * as Schedule from "effect/Schedule";
import * as Scope from "effect/Scope";
import { timeoutRef, tracingRef } from "./config.js";
import { nextId } from "./IdGenerator.js";
import { TransportError } from "./TransportError.js";
import { TransportService } from "./TransportService.js";

/**
 * Reconnection options for WebSocket transport.
 *
 * @since 0.0.1
 */
export interface ReconnectOptions {
	/** Max reconnection attempts (default: 10) */
	maxAttempts?: number;
	/** Initial delay in ms (default: 1000) */
	delay?: number;
	/** Max delay in ms (default: 30000) */
	maxDelay?: number;
	/** Multiplier for exponential backoff (default: 2) */
	multiplier?: number;
}

/**
 * Configuration options for WebSocket transport.
 *
 * @description
 * Allows customization of WebSocket connection behavior including
 * sub-protocols, request timeouts, reconnection, and keep-alive.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * const config: WebSocketTransportConfig = {
 *   url: 'wss://mainnet.infura.io/ws/v3/YOUR_KEY',
 *   timeout: 60000,  // 60 second request timeout
 *   reconnect: {
 *     maxAttempts: 10,
 *     delay: 1000,
 *     maxDelay: 30000,
 *     multiplier: 2
 *   },
 *   keepAlive: 30000  // 30 second pings
 * }
 * ```
 */
interface WebSocketTransportConfig {
	/** The WebSocket endpoint URL (ws:// or wss://) */
	url: string;
	/** Optional WebSocket sub-protocols for connection negotiation */
	protocols?: string | string[];
	/** Request timeout in milliseconds (default: 30000) */
	timeout?: number;
	/** Auto-reconnect on disconnect */
	reconnect?: boolean | ReconnectOptions;
	/** Keep-alive ping interval in ms */
	keepAlive?: number;
}

/**
 * JSON-RPC response structure.
 *
 * @description
 * Standard JSON-RPC 2.0 response format as returned by Ethereum nodes.
 *
 * @since 0.0.1
 */
interface JsonRpcResponse<T> {
	/** JSON-RPC version (always "2.0") */
	jsonrpc: string;
	/** Request ID for correlation with pending requests */
	id: number | string;
	/** Successful result (present if no error) */
	result?: T;
	/** Error object (present if request failed) */
	error?: { code: number; message: string; data?: unknown };
}

/**
 * Queued request during reconnection.
 */
interface QueuedRequest {
	id: number;
	method: string;
	params: unknown[];
	deferred: Deferred.Deferred<JsonRpcResponse<unknown>, never>;
}

const DEFAULT_RECONNECT_OPTIONS: Required<ReconnectOptions> = {
	maxAttempts: 10,
	delay: 1000,
	maxDelay: 30000,
	multiplier: 2,
};

/**
 * Creates a WebSocket transport layer for JSON-RPC communication.
 *
 * @description
 * Provides a WebSocket-based implementation of the TransportService.
 * Maintains a persistent connection and handles request/response correlation
 * automatically via JSON-RPC IDs. The connection is automatically cleaned
 * up when the Effect scope is closed.
 *
 * The transport:
 * - Establishes WebSocket connection on layer creation
 * - Correlates responses to requests via ID
 * - Handles pending request cleanup on connection close
 * - Automatically closes connection when scope ends
 * - Reconnects automatically with exponential backoff (if enabled)
 * - Sends keep-alive pings (if configured)
 * - Queues requests during reconnection
 *
 * @param options - URL string or configuration object
 * @returns Scoped Layer providing TransportService (use with Effect.scoped)
 *
 * @throws {TransportError} When WebSocket is not available in the environment
 * @throws {TransportError} When connection fails
 * @throws {TransportError} When request times out
 * @throws {TransportError} When connection closes unexpectedly
 * @throws {TransportError} When max reconnection attempts exceeded
 *
 * @since 0.0.1
 *
 * @example Simple URL configuration
 * ```typescript
 * import { Effect } from 'effect'
 * import { WebSocketTransport, TransportService } from 'voltaire-effect'
 *
 * const transport = WebSocketTransport('wss://mainnet.infura.io/ws/v3/YOUR_KEY')
 *
 * const program = Effect.gen(function* () {
 *   const t = yield* TransportService
 *   return yield* t.request<string>('eth_blockNumber')
 * }).pipe(
 *   Effect.provide(transport),
 *   Effect.scoped  // Required for scoped layers
 * )
 * ```
 *
 * @example With reconnection and keep-alive
 * ```typescript
 * import { Effect } from 'effect'
 * import { WebSocketTransport, TransportService } from 'voltaire-effect'
 *
 * const transport = WebSocketTransport({
 *   url: 'wss://mainnet.infura.io/ws/v3/YOUR_KEY',
 *   timeout: 60000,
 *   reconnect: {
 *     maxAttempts: 10,
 *     delay: 1000,
 *     maxDelay: 30000
 *   },
 *   keepAlive: 30000 // 30 second pings
 * })
 *
 * const program = Effect.gen(function* () {
 *   const t = yield* TransportService
 *   return yield* t.request<string>('eth_blockNumber')
 * }).pipe(
 *   Effect.provide(transport),
 *   Effect.scoped
 * )
 * ```
 *
 * @see {@link TransportService} - The service interface
 * @see {@link TransportError} - Error type thrown on failure
 * @see {@link HttpTransport} - For standard request/response patterns
 */
export const WebSocketTransport = (
	options: WebSocketTransportConfig | string,
): Layer.Layer<
	TransportService,
	TransportError,
	Socket.WebSocketConstructor
> => {
	const config =
		typeof options === "string"
			? { url: options, timeout: 30000, reconnect: false, keepAlive: undefined }
			: {
					url: options.url,
					protocols: options.protocols,
					timeout: options.timeout ?? 30000,
					reconnect: options.reconnect ?? false,
					keepAlive: options.keepAlive,
				};

	const reconnectEnabled = config.reconnect !== false;
	const reconnectOpts: Required<ReconnectOptions> =
		typeof config.reconnect === "object"
			? { ...DEFAULT_RECONNECT_OPTIONS, ...config.reconnect }
			: DEFAULT_RECONNECT_OPTIONS;

	return Layer.scoped(
		TransportService,
		Effect.gen(function* () {
			const pendingRef = yield* Ref.make<
				Map<number | string, Deferred.Deferred<JsonRpcResponse<unknown>, never>>
			>(new Map());
			const writerRef = yield* Ref.make<
				| ((
						chunk: Uint8Array | string | Socket.CloseEvent,
				  ) => Effect.Effect<void, Socket.SocketError>)
				| null
			>(null);
			const isReconnectingRef = yield* Ref.make(false);
			const queueRef = yield* Ref.make<QueuedRequest[]>([]);
			const isClosedRef = yield* Ref.make(false);
			const keepAliveFiberRef = yield* Ref.make<Fiber.Fiber<
				void,
				never
			> | null>(null);
			const socketFiberRef = yield* Ref.make<Fiber.Fiber<
				void,
				Socket.SocketError
			> | null>(null);
			const reconnectAttemptsRef = yield* Ref.make(0);

			const processMessage = (data: string | Uint8Array) =>
				Effect.gen(function* () {
					const text =
						typeof data === "string" ? data : new TextDecoder().decode(data);
					let message: JsonRpcResponse<unknown>;
					try {
						message = JSON.parse(text) as JsonRpcResponse<unknown>;
					} catch {
						return;
					}

					if (message.id === "keepalive") return;

					let foundDeferred:
						| Deferred.Deferred<JsonRpcResponse<unknown>, never>
						| undefined;
					yield* Ref.update(pendingRef, (pending) => {
						foundDeferred = pending.get(message.id);
						if (foundDeferred) {
							const newPending = new Map(pending);
							newPending.delete(message.id);
							return newPending;
						}
						return pending;
					});
					if (foundDeferred) {
						yield* Deferred.succeed(foundDeferred, message);
					}
				});

			const stopKeepAlive = Effect.gen(function* () {
				const fiber = yield* Ref.get(keepAliveFiberRef);
				if (fiber !== null) {
					yield* Fiber.interrupt(fiber);
					yield* Ref.set(keepAliveFiberRef, null);
				}
			});

			const startKeepAlive = Effect.gen(function* () {
				if (!config.keepAlive) return;

				yield* stopKeepAlive;

				const writer = yield* Ref.get(writerRef);
				if (!writer) return;

				const keepAliveEffect = Effect.gen(function* () {
					const w = yield* Ref.get(writerRef);
					if (w) {
						yield* w(
							JSON.stringify({
								jsonrpc: "2.0",
								id: "keepalive",
								method: "web3_clientVersion",
								params: [],
							}),
						).pipe(Effect.ignore);
					}
				}).pipe(
					Effect.repeat(Schedule.spaced(Duration.millis(config.keepAlive))),
					Effect.ignore,
				);

				const fiber = yield* Effect.fork(keepAliveEffect);
				yield* Ref.set(keepAliveFiberRef, fiber);
			});

			const flushQueue = Effect.gen(function* () {
				const writer = yield* Ref.get(writerRef);
				if (!writer) return;

				const queue = yield* Ref.getAndSet(queueRef, []);
				for (const item of queue) {
					const request = JSON.stringify({
						jsonrpc: "2.0",
						id: item.id,
						method: item.method,
						params: item.params,
					});

					yield* Ref.update(pendingRef, (pending) => {
						const newPending = new Map(pending);
						newPending.set(item.id, item.deferred);
						return newPending;
					});

					yield* writer(request).pipe(Effect.ignore);
				}
			});

			const failAllPending = (error: TransportError) =>
				Effect.gen(function* () {
					const pending = yield* Ref.getAndSet(pendingRef, new Map());
					const queue = yield* Ref.getAndSet(queueRef, []);

					for (const [id, deferred] of pending) {
						yield* Deferred.succeed(deferred, {
							jsonrpc: "2.0",
							id,
							error: { code: error.code, message: error.message },
						});
					}

					for (const item of queue) {
						yield* Deferred.succeed(item.deferred, {
							jsonrpc: "2.0",
							id: item.id,
							error: { code: error.code, message: error.message },
						});
					}
				});

			const connect: Effect.Effect<
				void,
				TransportError,
				Scope.Scope | Socket.WebSocketConstructor
			> = Effect.gen(function* () {
				const isClosed = yield* Ref.get(isClosedRef);
				if (isClosed) {
					return yield* Effect.fail(
						new TransportError({
							code: -32603,
							message: "WebSocket transport is closed",
						}),
					);
				}

				const socket = yield* Socket.makeWebSocket(config.url, {
					protocols: config.protocols
						? Array.isArray(config.protocols)
							? config.protocols
							: [config.protocols]
						: undefined,
					openTimeout: Duration.millis(config.timeout),
				}).pipe(
					Effect.mapError(
						(e) =>
							new TransportError({
								code: -32603,
								message: `WebSocket connection failed: ${String(e)}`,
							}),
					),
				);

				const scope = yield* Effect.scope;

				const writer = yield* Scope.extend(socket.writer, scope).pipe(
					Effect.mapError(
						() =>
							new TransportError({
								code: -32603,
								message: "Failed to get WebSocket writer",
							}),
					),
				);

				yield* Ref.set(writerRef, writer);

				yield* Ref.set(reconnectAttemptsRef, 0);
				yield* Ref.set(isReconnectingRef, false);
				yield* startKeepAlive;
				yield* flushQueue;

				const socketFiber = yield* Effect.fork(
					socket
						.runRaw((data) => processMessage(data))
						.pipe(
							Effect.catchAll((socketError) =>
								Effect.gen(function* () {
									yield* stopKeepAlive;
									yield* Ref.set(writerRef, null);

									const closed = yield* Ref.get(isClosedRef);
									if (closed) {
										yield* failAllPending(
											new TransportError({
												code: -32603,
												message: "WebSocket closed",
											}),
										);
										return;
									}

									if (reconnectEnabled) {
										const attempts = yield* Ref.get(reconnectAttemptsRef);
										if (attempts < reconnectOpts.maxAttempts) {
											yield* Ref.set(isReconnectingRef, true);

											const delay = Math.min(
												reconnectOpts.delay *
													reconnectOpts.multiplier ** attempts,
												reconnectOpts.maxDelay,
											);

											yield* Ref.update(reconnectAttemptsRef, (n) => n + 1);

											yield* Effect.sleep(Duration.millis(delay));
											yield* Effect.scoped(connect).pipe(Effect.ignore);
										} else {
											yield* failAllPending(
												new TransportError({
													code: -32603,
													message: `WebSocket reconnection failed after ${reconnectOpts.maxAttempts} attempts`,
												}),
											);
										}
									} else {
										yield* failAllPending(
											new TransportError({
												code: -32603,
												message: `WebSocket closed: ${String(socketError)}`,
											}),
										);
									}
								}),
							),
						),
				);

				yield* Ref.set(socketFiberRef, socketFiber);
			});

			yield* Effect.scoped(connect);

			yield* Effect.addFinalizer(() =>
				Effect.gen(function* () {
					yield* Ref.set(isClosedRef, true);
					yield* stopKeepAlive;

					const socketFiber = yield* Ref.get(socketFiberRef);
					if (socketFiber) {
						yield* Fiber.interrupt(socketFiber);
					}

					const writer = yield* Ref.get(writerRef);
					if (writer) {
						yield* writer(new Socket.CloseEvent(1000, "Normal closure")).pipe(
							Effect.ignore,
						);
					}

					yield* failAllPending(
						new TransportError({
							code: -32603,
							message: "WebSocket transport closed",
						}),
					);
				}),
			);

			return {
				request: <T>(method: string, params: unknown[] = []) =>
					Effect.gen(function* () {
						const timeoutOverride = yield* FiberRef.get(timeoutRef);
						const tracingEnabled = yield* FiberRef.get(tracingRef);
						const timeout = timeoutOverride ?? Duration.millis(config.timeout);
						const timeoutMs = Duration.toMillis(timeout);
						const writer = yield* Ref.get(writerRef);
						const isReconnecting = yield* Ref.get(isReconnectingRef);

						if (tracingEnabled) {
							yield* Effect.logDebug(`rpc ${method} -> ${config.url}`);
						}

						if (!writer || isReconnecting) {
							if (reconnectEnabled) {
								const id = yield* nextId;
								const deferred = yield* Deferred.make<
									JsonRpcResponse<T>,
									never
								>();

								yield* Ref.update(queueRef, (q) => [
									...q,
									{
										id,
										method,
										params,
										deferred: deferred as Deferred.Deferred<
											JsonRpcResponse<unknown>,
											never
										>,
									},
								]);

								const response = yield* Deferred.await(deferred).pipe(
									Effect.timeout(timeout),
									Effect.catchTag("TimeoutException", () =>
										Effect.gen(function* () {
											yield* Ref.update(queueRef, (q) =>
												q.filter((item) => item.id !== id),
											);
											return yield* Effect.fail(
												new TransportError({
													code: -32603,
													message: `Request timeout after ${timeoutMs}ms`,
												}),
											);
										}),
									),
								);

								if (response.error) {
									return yield* Effect.fail(
										new TransportError({
											code: response.error.code,
											message: response.error.message,
											data: response.error.data,
										}),
									);
								}

								return response.result as T;
							}

							return yield* Effect.fail(
								new TransportError({
									code: -32603,
									message: "WebSocket not connected",
								}),
							);
						}

						const id = yield* nextId;
						const deferred = yield* Deferred.make<JsonRpcResponse<T>, never>();

						yield* Ref.update(pendingRef, (pending) => {
							const newPending = new Map(pending);
							newPending.set(
								id,
								deferred as Deferred.Deferred<JsonRpcResponse<unknown>, never>,
							);
							return newPending;
						});

						const request = JSON.stringify({
							jsonrpc: "2.0",
							id,
							method,
							params,
						});

						yield* writer(request).pipe(
							Effect.mapError(
								() =>
									new TransportError({
										code: -32603,
										message: "Failed to send WebSocket message",
									}),
							),
						);

						const response = yield* Deferred.await(deferred).pipe(
							Effect.timeout(timeout),
							Effect.catchTag("TimeoutException", () =>
								Effect.gen(function* () {
									yield* Ref.update(pendingRef, (p) => {
										const newPending = new Map(p);
										newPending.delete(id);
										return newPending;
									});
									return yield* Effect.fail(
										new TransportError({
											code: -32603,
											message: `Request timeout after ${timeoutMs}ms`,
										}),
									);
								}),
							),
						);

						if (response.error) {
							return yield* Effect.fail(
								new TransportError({
									code: response.error.code,
									message: response.error.message,
									data: response.error.data,
								}),
							);
						}

						return response.result as T;
					}),
			};
		}),
	);
};

/**
 * Layer that provides the global WebSocket constructor.
 * Use this when running in environments with a global WebSocket (browsers, Node.js 18+, Deno, Bun).
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { WebSocketTransport, WebSocketConstructorGlobal, TransportService } from 'voltaire-effect'
 *
 * const transport = WebSocketTransport('wss://mainnet.infura.io/ws/v3/YOUR_KEY').pipe(
 *   Layer.provide(WebSocketConstructorGlobal)
 * )
 * ```
 */
export const WebSocketConstructorGlobal =
	Socket.layerWebSocketConstructorGlobal;
