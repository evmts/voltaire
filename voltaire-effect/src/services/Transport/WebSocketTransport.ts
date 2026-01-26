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

import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Queue from "effect/Queue";
import * as Ref from "effect/Ref";
import * as Runtime from "effect/Runtime";
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
	reconnect?:
		| boolean
		| ReconnectOptions;
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
 * import { WebSocketTransport, TransportService } from 'voltaire-effect/services'
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
 * import { WebSocketTransport, TransportService } from 'voltaire-effect/services'
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
): Layer.Layer<TransportService, TransportError> => {
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
			if (typeof globalThis.WebSocket === "undefined") {
				return yield* Effect.fail(
					new TransportError({
						code: -32603,
						message: "WebSocket is not available in this environment",
					}),
				);
			}

			const runtime = yield* Effect.runtime<never>();
			const requestIdRef = yield* Ref.make(0);
			const pendingRef = yield* Ref.make<
				Map<number, Deferred.Deferred<JsonRpcResponse<unknown>, never>>
			>(new Map());
			const wsRef = yield* Ref.make<WebSocket | null>(null);
			const attemptCountRef = yield* Ref.make(0);
			const currentDelayRef = yield* Ref.make(reconnectOpts.delay);
			const isReconnectingRef = yield* Ref.make(false);
			const queueRef = yield* Ref.make<QueuedRequest[]>([]);
			const isClosedRef = yield* Ref.make(false);
			const keepAliveTimerRef = yield* Ref.make<ReturnType<typeof setInterval> | null>(null);
			const messageQueue = yield* Queue.unbounded<unknown>();

			const stopKeepAlive = Effect.gen(function* () {
				const timer = yield* Ref.get(keepAliveTimerRef);
				if (timer !== null) {
					clearInterval(timer);
					yield* Ref.set(keepAliveTimerRef, null);
				}
			});

			const startKeepAlive = Effect.gen(function* () {
				if (!config.keepAlive) return;

				yield* stopKeepAlive;

				const ws = yield* Ref.get(wsRef);
				if (!ws || ws.readyState !== WebSocket.OPEN) return;

				const timer = setInterval(() => {
					Runtime.runFork(runtime)(
						Effect.gen(function* () {
							const socket = yield* Ref.get(wsRef);
							if (socket && socket.readyState === WebSocket.OPEN) {
								socket.send(
									JSON.stringify({
										jsonrpc: "2.0",
										id: "keepalive",
										method: "web3_clientVersion",
										params: [],
									}),
								);
							}
						}),
					);
				}, config.keepAlive);

				yield* Ref.set(keepAliveTimerRef, timer);
			});

			const flushQueue = Effect.gen(function* () {
				const ws = yield* Ref.get(wsRef);
				if (!ws || ws.readyState !== WebSocket.OPEN) return;

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

					ws.send(request);
				}
			});

			const processMessage = (data: unknown) =>
				Effect.gen(function* () {
					let message: JsonRpcResponse<unknown>;
					try {
						message = JSON.parse(data as string) as JsonRpcResponse<unknown>;
					} catch {
						return;
					}

					if (message.id === "keepalive") return;

					let foundDeferred:
						| Deferred.Deferred<JsonRpcResponse<unknown>, never>
						| undefined;
					yield* Ref.update(pendingRef, (pending) => {
						foundDeferred = pending.get(message.id as number);
						if (foundDeferred) {
							const newPending = new Map(pending);
							newPending.delete(message.id as number);
							return newPending;
						}
						return pending;
					});
					if (foundDeferred) {
						yield* Deferred.succeed(foundDeferred, message);
					}
				});

			yield* Effect.forkScoped(
				Queue.take(messageQueue).pipe(
					Effect.flatMap(processMessage),
					Effect.forever,
				),
			);

			const connect: Effect.Effect<WebSocket, TransportError> = Effect.gen(function* () {
				const isClosed = yield* Ref.get(isClosedRef);
				if (isClosed) {
					return yield* Effect.fail(
						new TransportError({
							code: -32603,
							message: "WebSocket transport is closed",
						}),
					);
				}

				const connectDeferred = yield* Deferred.make<WebSocket, TransportError>();
				const ws = new WebSocket(config.url, config.protocols);

				ws.onopen = () => {
					Runtime.runFork(runtime)(
						Effect.gen(function* () {
							yield* Ref.set(attemptCountRef, 0);
							yield* Ref.set(currentDelayRef, reconnectOpts.delay);
							yield* Ref.set(wsRef, ws);
							yield* Ref.set(isReconnectingRef, false);
							yield* Deferred.succeed(connectDeferred, ws);
							yield* startKeepAlive;
							yield* flushQueue;
						}),
					);
				};

				ws.onerror = () => {
					Runtime.runFork(runtime)(
						Deferred.fail(
							connectDeferred,
							new TransportError({
								code: -32603,
								message: "WebSocket connection failed",
							}),
						),
					);
				};

				ws.onmessage = (event) => {
					Runtime.runFork(runtime)(Queue.offer(messageQueue, event.data));
				};

				ws.onclose = () => {
					Runtime.runFork(runtime)(
						Effect.gen(function* () {
							yield* stopKeepAlive;
							yield* Ref.set(wsRef, null);

							const isClosed = yield* Ref.get(isClosedRef);
							if (isClosed) {
								const pending = yield* Ref.getAndSet(pendingRef, new Map());
								const error = new TransportError({
									code: -32603,
									message: "WebSocket closed",
								});
								for (const [id, deferred] of pending) {
									yield* Deferred.succeed(deferred, {
										jsonrpc: "2.0",
										id,
										error: { code: error.code, message: error.message },
									});
								}
								return;
							}

							if (reconnectEnabled) {
								const attempts = yield* Ref.get(attemptCountRef);
								if (attempts < reconnectOpts.maxAttempts) {
									yield* Ref.set(isReconnectingRef, true);
									const delay = yield* Ref.get(currentDelayRef);

									yield* Ref.update(attemptCountRef, (n) => n + 1);
									yield* Ref.update(currentDelayRef, (d) =>
										Math.min(d * reconnectOpts.multiplier, reconnectOpts.maxDelay),
									);

									setTimeout(() => {
										Effect.runPromise(
											connect.pipe(
												Effect.catchAll(() => Effect.void),
											),
										);
									}, delay);
								} else {
									const pending = yield* Ref.getAndSet(pendingRef, new Map());
									const queue = yield* Ref.getAndSet(queueRef, []);
									const error = new TransportError({
										code: -32603,
										message: `WebSocket reconnection failed after ${reconnectOpts.maxAttempts} attempts`,
									});

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
								}
							} else {
								const pending = yield* Ref.getAndSet(pendingRef, new Map());
								const error = new TransportError({
									code: -32603,
									message: "WebSocket closed",
								});
								for (const [id, deferred] of pending) {
									yield* Deferred.succeed(deferred, {
										jsonrpc: "2.0",
										id,
										error: { code: error.code, message: error.message },
									});
								}
							}
						}),
					);
				};

				return yield* Deferred.await(connectDeferred);
			});

			yield* connect;

			yield* Effect.addFinalizer(() =>
				Effect.gen(function* () {
					yield* Ref.set(isClosedRef, true);
					yield* stopKeepAlive;
					const ws = yield* Ref.get(wsRef);
					if (ws) {
						ws.close();
					}
				}),
			);

			return {
				request: <T>(method: string, params: unknown[] = []) =>
					Effect.gen(function* () {
						const ws = yield* Ref.get(wsRef);
						const isReconnecting = yield* Ref.get(isReconnectingRef);

						if (!ws || ws.readyState !== WebSocket.OPEN || isReconnecting) {
							if (reconnectEnabled) {
								const id = yield* Ref.updateAndGet(requestIdRef, (n) => n + 1);
								const deferred = yield* Deferred.make<JsonRpcResponse<T>, never>();

								yield* Ref.update(queueRef, (q) => [
									...q,
									{
										id,
										method,
										params,
										deferred: deferred as Deferred.Deferred<JsonRpcResponse<unknown>, never>,
									},
								]);

								const response = yield* Deferred.await(deferred).pipe(
									Effect.timeout(config.timeout),
									Effect.catchTag("TimeoutException", () =>
										Effect.gen(function* () {
											yield* Ref.update(queueRef, (q) =>
												q.filter((item) => item.id !== id),
											);
											return yield* Effect.fail(
												new TransportError({
													code: -32603,
													message: `Request timeout after ${config.timeout}ms`,
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

						const id = yield* Ref.updateAndGet(requestIdRef, (n) => n + 1);
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

						ws.send(request);

						const response = yield* Deferred.await(deferred).pipe(
							Effect.timeout(config.timeout),
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
											message: `Request timeout after ${config.timeout}ms`,
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
