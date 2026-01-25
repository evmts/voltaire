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
import * as Ref from "effect/Ref";
import { TransportError } from "./TransportError.js";
import { TransportService } from "./TransportService.js";

/**
 * Configuration options for WebSocket transport.
 *
 * @description
 * Allows customization of WebSocket connection behavior including
 * sub-protocols and request timeouts.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * const config: WebSocketTransportConfig = {
 *   url: 'wss://mainnet.infura.io/ws/v3/YOUR_KEY',
 *   timeout: 60000,  // 60 second request timeout
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
	id: number;
	/** Successful result (present if no error) */
	result?: T;
	/** Error object (present if request failed) */
	error?: { code: number; message: string; data?: unknown };
}

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
 *
 * @param options - URL string or configuration object
 * @returns Scoped Layer providing TransportService (use with Effect.scoped)
 *
 * @throws {TransportError} When WebSocket is not available in the environment
 * @throws {TransportError} When connection fails
 * @throws {TransportError} When request times out
 * @throws {TransportError} When connection closes unexpectedly
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
 * @example With configuration and PublicClient
 * ```typescript
 * import { Effect } from 'effect'
 * import { WebSocketTransport, PublicClient, PublicClientService } from 'voltaire-effect/services'
 *
 * const transport = WebSocketTransport({
 *   url: 'wss://mainnet.infura.io/ws/v3/YOUR_KEY',
 *   timeout: 60000  // 60 second timeout
 * })
 *
 * const program = Effect.gen(function* () {
 *   const client = yield* PublicClientService
 *   const blockNumber = yield* client.getBlockNumber()
 *   return blockNumber
 * }).pipe(
 *   Effect.provide(PublicClient),
 *   Effect.provide(transport),
 *   Effect.scoped
 * )
 *
 * await Effect.runPromise(program)
 * ```
 *
 * @example Subscribing to new blocks (requires subscription support)
 * ```typescript
 * import { Effect } from 'effect'
 * import { WebSocketTransport, TransportService } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const transport = yield* TransportService
 *
 *   // Subscribe to new block headers
 *   const subscriptionId = yield* transport.request<string>(
 *     'eth_subscribe',
 *     ['newHeads']
 *   )
 *
 *   console.log(`Subscribed with ID: ${subscriptionId}`)
 *
 *   // Unsubscribe when done
 *   yield* transport.request<boolean>('eth_unsubscribe', [subscriptionId])
 * }).pipe(
 *   Effect.provide(WebSocketTransport('wss://mainnet.infura.io/ws/v3/YOUR_KEY')),
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
			? { url: options, timeout: 30000 }
			: {
					url: options.url,
					protocols: options.protocols,
					timeout: options.timeout ?? 30000,
				};

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

			const requestIdRef = yield* Ref.make(0);
			const pendingRef = yield* Ref.make<
				Map<number, Deferred.Deferred<JsonRpcResponse<unknown>, never>>
			>(new Map());

			const connectDeferred = yield* Deferred.make<WebSocket, TransportError>();
			const ws = new WebSocket(config.url, config.protocols);

			ws.onopen = () => {
				Effect.runSync(Deferred.succeed(connectDeferred, ws));
			};

			ws.onerror = () => {
				Effect.runSync(
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
				try {
					const message = JSON.parse(event.data) as JsonRpcResponse<unknown>;
					Effect.runSync(
						Effect.gen(function* () {
							const pending = yield* Ref.get(pendingRef);
							const deferred = pending.get(message.id);
							if (deferred) {
								pending.delete(message.id);
								yield* Ref.set(pendingRef, pending);
								yield* Deferred.succeed(deferred, message);
							}
						}),
					);
				} catch {
					// Ignore parse errors
				}
			};

			ws.onclose = () => {
				Effect.runSync(
					Effect.gen(function* () {
						const pending = yield* Ref.get(pendingRef);
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
						yield* Ref.set(pendingRef, new Map());
					}),
				);
			};

			yield* Deferred.await(connectDeferred);

			yield* Effect.addFinalizer(() =>
				Effect.sync(() => {
					ws.close();
				}),
			);

			return {
				request: <T>(method: string, params: unknown[] = []) =>
					Effect.gen(function* () {
						if (ws.readyState !== WebSocket.OPEN) {
							return yield* Effect.fail(
								new TransportError({
									code: -32603,
									message: "WebSocket not connected",
								}),
							);
						}

						const id = yield* Ref.updateAndGet(requestIdRef, (n) => n + 1);
						const deferred = yield* Deferred.make<JsonRpcResponse<T>, never>();

						const pending = yield* Ref.get(pendingRef);
						pending.set(
							id,
							deferred as Deferred.Deferred<JsonRpcResponse<unknown>, never>,
						);
						yield* Ref.set(pendingRef, pending);

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
									const p = yield* Ref.get(pendingRef);
									p.delete(id);
									yield* Ref.set(pendingRef, p);
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
