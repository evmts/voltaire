/**
 * @fileoverview HTTP transport implementation for JSON-RPC communication.
 *
 * @module HttpTransport
 * @since 0.0.1
 *
 * @description
 * Provides an HTTP-based transport layer for communicating with Ethereum JSON-RPC
 * endpoints. This is the most common transport for interacting with Ethereum nodes.
 *
 * Features:
 * - Automatic retry with configurable attempts and delay
 * - Request timeout handling
 * - Custom headers support (for API keys, authentication)
 * - Request/response hooks with FiberRef overrides
 * - Fetch options + custom fetch support
 * - Proper JSON-RPC error handling
 *
 * @see {@link TransportService} - The service interface this implements
 * @see {@link WebSocketTransport} - Alternative for real-time subscriptions
 * @see {@link BrowserTransport} - Alternative for browser wallet interaction
 */

import { FetchHttpClient } from "@effect/platform";
import * as HttpClient from "@effect/platform/HttpClient";
import * as HttpClientRequest from "@effect/platform/HttpClientRequest";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as FiberRef from "effect/FiberRef";
import * as Layer from "effect/Layer";
import * as Schedule from "effect/Schedule";
import { type BatchOptions, createBatchScheduler } from "./BatchScheduler.js";
import { retryCountRef, timeoutRef, tracingRef } from "./config.js";
import { nextId } from "./IdGenerator.js";
import { TransportError } from "./TransportError.js";
import {
	onRequestRef,
	onResponseRef,
	type RpcRequest,
	type RpcResponse,
} from "./TransportInterceptor.js";
import { TransportService } from "./TransportService.js";

/**
 * Configuration options for HTTP transport.
 *
 * @description
 * Allows customization of the HTTP transport behavior including timeouts,
 * retry logic, and custom headers.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * const config: HttpTransportConfig = {
 *   url: 'https://mainnet.infura.io/v3/YOUR_KEY',
 *   timeout: 60000,      // 60 second timeout
 *   retries: 5,          // 5 retry attempts
 *   retryDelay: 2000,    // 2 seconds between retries
 *   headers: {
 *     'X-API-Key': 'your-api-key'
 *   }
 * }
 * ```
 */
export interface HttpTransportConfig {
	/** The JSON-RPC endpoint URL (must be HTTPS for production) */
	url: string;
	/** Optional custom headers to include in requests (e.g., API keys) */
	headers?: Record<string, string>;
	/** Optional fetch RequestInit options (credentials, headers, etc.) */
	fetchOptions?: RequestInit;
	/** Optional custom fetch implementation */
	fetch?: typeof globalThis.fetch;
	/** Optional request hook (can modify method/params) */
	onRequest?: (request: RpcRequest) => Effect.Effect<RpcRequest>;
	/** Optional response hook (can modify result) */
	onResponse?: <T>(response: RpcResponse<T>) => Effect.Effect<RpcResponse<T>>;
	/** Request timeout in milliseconds (default: 30000) */
	timeout?: number;
	/** Number of retry attempts on failure (default: 3) */
	retries?: number;
	/** Delay between retries in milliseconds (default: 1000) */
	retryDelay?: number;
	/** Enable request batching */
	batch?: BatchOptions;
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
	/** Request ID for correlation */
	id: number;
	/** Successful result (present if no error) */
	result?: T;
	/** Error object (present if request failed) */
	error?: { code: number; message: string; data?: unknown };
}

/**
 * Creates an HTTP transport layer for JSON-RPC communication.
 *
 * @description
 * Provides an HTTP-based implementation of the TransportService. Supports
 * automatic retries, timeouts, and custom headers. Uses @effect/platform
 * HttpClient for cross-platform compatibility.
 *
 * The transport automatically:
 * - Retries failed requests (configurable)
 * - Times out long-running requests
 * - Parses JSON-RPC responses and extracts errors
 * - Handles network errors gracefully
 *
 * @param options - URL string or configuration object
 * @returns Layer providing TransportService, requires HttpClient.HttpClient
 *
 * @throws {TransportError} When the request fails after all retries
 * @throws {TransportError} When the request times out
 * @throws {TransportError} When the JSON-RPC response contains an error
 *
 * @since 0.0.1
 *
 * @example Simple URL configuration
 * ```typescript
 * import { Effect } from 'effect'
 * import { FetchHttpClient } from '@effect/platform'
 * import { HttpTransport, TransportService } from 'voltaire-effect/services'
 *
 * const transport = HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY')
 *
 * const program = Effect.gen(function* () {
 *   const t = yield* TransportService
 *   return yield* t.request<string>('eth_blockNumber')
 * }).pipe(
 *   Effect.provide(transport),
 *   Effect.provide(FetchHttpClient.layer)
 * )
 * ```
 *
 * @example Full configuration with retries and timeout
 * ```typescript
 * import { Effect } from 'effect'
 * import { FetchHttpClient } from '@effect/platform'
 * import { HttpTransport, Provider, ProviderService } from 'voltaire-effect/services'
 *
 * const transport = HttpTransport({
 *   url: 'https://mainnet.infura.io/v3/YOUR_KEY',
 *   timeout: 60000,     // 60 second timeout
 *   retries: 5,         // 5 retry attempts
 *   retryDelay: 2000,   // 2 seconds between retries
 *   headers: {
 *     'Authorization': 'Bearer YOUR_TOKEN',
 *     'X-Custom-Header': 'value'
 *   }
 * })
 *
 * const program = Effect.gen(function* () {
 *   const client = yield* ProviderService
 *   return yield* client.getBlockNumber()
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(transport),
 *   Effect.provide(FetchHttpClient.layer)
 * )
 *
 * await Effect.runPromise(program)
 * ```
 *
 * @example Error handling
 * ```typescript
 * import { Effect } from 'effect'
 * import { FetchHttpClient } from '@effect/platform'
 * import { HttpTransport, TransportService, TransportError } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const transport = yield* TransportService
 *   return yield* transport.request<string>('eth_blockNumber')
 * }).pipe(
 *   Effect.catchTag('TransportError', (error) => {
 *     console.error(`Request failed: ${error.message} (code: ${error.code})`)
 *     return Effect.succeed('0x0')
 *   }),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY')),
 *   Effect.provide(FetchHttpClient.layer)
 * )
 * ```
 *
 * @see {@link TransportService} - The service interface
 * @see {@link TransportError} - Error type thrown on failure
 * @see {@link WebSocketTransport} - For real-time subscriptions
 */
export const HttpTransport = (
	options: HttpTransportConfig | string,
): Layer.Layer<TransportService, never, HttpClient.HttpClient> => {
	const config =
		typeof options === "string"
			? {
					url: options,
					headers: undefined,
					fetchOptions: undefined,
					fetch: undefined,
					onRequest: undefined,
					onResponse: undefined,
					timeout: 30000,
					retries: 3,
					retryDelay: 1000,
					batch: undefined as BatchOptions | undefined,
				}
			: {
					url: options.url,
					headers: options.headers,
					fetchOptions: options.fetchOptions,
					fetch: options.fetch,
					onRequest: options.onRequest,
					onResponse: options.onResponse,
					timeout: options.timeout ?? 30000,
					retries: options.retries ?? 3,
					retryDelay: options.retryDelay ?? 1000,
					batch: options.batch,
				};

	const toTransportError = (e: unknown, context?: string): TransportError => {
		if (e instanceof TransportError) return e;
		const message = e instanceof Error ? e.message : "Network error";
		const fullMessage = context ? `${context}: ${message}` : message;
		return new TransportError({
			code: -32603,
			message: fullMessage,
			cause: e instanceof Error ? e : undefined,
		});
	};

	const makeRetrySchedule = (retries: number) =>
		Schedule.recurs(retries).pipe(
			Schedule.intersect(Schedule.spaced(Duration.millis(config.retryDelay))),
		);

	const applyRequestHooks = (request: RpcRequest): Effect.Effect<RpcRequest> =>
		Effect.gen(function* () {
			const scoped = yield* FiberRef.get(onRequestRef);
			const withConfig = config.onRequest
				? yield* config.onRequest(request)
				: request;
			return yield* scoped(withConfig);
		});

	const applyResponseHooks = <T>(
		response: RpcResponse<T>,
	): Effect.Effect<RpcResponse<T>> =>
		Effect.gen(function* () {
			const scoped = yield* FiberRef.get(onResponseRef);
			const withConfig = config.onResponse
				? yield* config.onResponse(response)
				: response;
			return yield* scoped(withConfig);
		});

	const applyFetchOptions = <A, E, R>(
		effect: Effect.Effect<A, E, R>,
	): Effect.Effect<A, E, R> => {
		let result = effect;
		if (config.fetchOptions) {
			result = Effect.provideService(
				result,
				FetchHttpClient.RequestInit,
				config.fetchOptions,
			);
		}
		if (config.fetch) {
			result = Effect.provideService(
				result,
				FetchHttpClient.Fetch,
				config.fetch,
			);
		}
		return result;
	};

	const doRequest = <T>(
		httpClient: HttpClient.HttpClient,
		body: string,
		timeoutMs: number,
		retrySchedule: Schedule.Schedule<number, number>,
		rpcMethod?: string,
	): Effect.Effect<T, TransportError> => {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			...config.headers,
		};

		const request = HttpClientRequest.post(config.url).pipe(
			HttpClientRequest.setHeaders(headers),
			HttpClientRequest.bodyUnsafeJson(JSON.parse(body)),
		);

		return Effect.scoped(
			applyFetchOptions(httpClient.execute(request)).pipe(
				Effect.timeout(Duration.millis(timeoutMs)),
				Effect.flatMap((response) => {
					if (response.status >= 200 && response.status < 300) {
						return Effect.map(
							response.json,
							(json) => json as JsonRpcResponse<T>,
						).pipe(
							Effect.mapError((e) =>
								toTransportError(
									e,
									`Failed to parse JSON response from ${config.url}${rpcMethod ? ` (${rpcMethod})` : ""}`,
								),
							),
						);
					}
					return Effect.fail(
						new TransportError({
							code: -32603,
							message: `HTTP ${response.status} (url: ${config.url}${rpcMethod ? `, method: ${rpcMethod}` : ""})`,
						}),
					);
				}),
				Effect.flatMap((json: JsonRpcResponse<T>) =>
					json.error
						? Effect.fail(
								new TransportError({
									code: json.error.code,
									message: json.error.message,
									data: json.error.data,
								}),
							)
						: Effect.succeed(json.result as T),
				),
			),
		).pipe(
			Effect.catchAllDefect((defect) =>
				Effect.fail(
					toTransportError(
						defect,
						`Request to ${config.url}${rpcMethod ? ` (${rpcMethod})` : ""} failed`,
					),
				),
			),
			Effect.catchAll((e) => {
				if (e instanceof TransportError) return Effect.fail(e);
				return Effect.fail(
					toTransportError(
						e,
						`Request to ${config.url}${rpcMethod ? ` (${rpcMethod})` : ""} failed`,
					),
				);
			}),
			Effect.retry(retrySchedule),
		);
	};

	interface JsonRpcBatchResponse {
		id: number;
		result?: unknown;
		error?: { code: number; message: string; data?: unknown };
	}

	const sendBatch =
		(httpClient: HttpClient.HttpClient) =>
		(
			requests: Array<{ id: number; method: string; params?: unknown[] }>,
		): Effect.Effect<JsonRpcBatchResponse[], TransportError> =>
			Effect.gen(function* () {
				const timeoutOverride = yield* FiberRef.get(timeoutRef);
				const retryOverride = yield* FiberRef.get(retryCountRef);
				const tracingEnabled = yield* FiberRef.get(tracingRef);
				const timeoutMs = timeoutOverride ?? config.timeout;
				const retrySchedule = makeRetrySchedule(
					retryOverride ?? config.retries,
				);

				if (tracingEnabled) {
					yield* Effect.logDebug(
						`rpc batch (${requests.length}) -> ${config.url}`,
					);
				}

				const batchBody = requests.map((r) => ({
					jsonrpc: "2.0",
					id: r.id,
					method: r.method,
					params: r.params ?? [],
				}));
				const headers: Record<string, string> = {
					"Content-Type": "application/json",
					...config.headers,
				};
				const methods = requests.map((r) => r.method).join(", ");

				const request = HttpClientRequest.post(config.url).pipe(
					HttpClientRequest.setHeaders(headers),
					HttpClientRequest.bodyUnsafeJson(batchBody),
				);

				return yield* Effect.scoped(
					applyFetchOptions(httpClient.execute(request)).pipe(
						Effect.timeout(Duration.millis(timeoutMs)),
						Effect.flatMap((response) => {
							if (response.status >= 200 && response.status < 300) {
								return Effect.map(
									response.json,
									(json) => json as JsonRpcBatchResponse[],
								).pipe(
									Effect.mapError((e) =>
										toTransportError(
											e,
											`Failed to parse batch JSON response from ${config.url}`,
										),
									),
								);
							}
							return Effect.fail(
								new TransportError({
									code: -32603,
									message: `HTTP ${response.status} (url: ${config.url}, methods: [${methods}])`,
								}),
							);
						}),
					),
				).pipe(
					Effect.catchAllDefect((defect) =>
						Effect.fail(
							toTransportError(
								defect,
								`Batch request to ${config.url} failed [${methods}]`,
							),
						),
					),
					Effect.catchAll((e) => {
						if (e instanceof TransportError) return Effect.fail(e);
						return Effect.fail(
							toTransportError(
								e,
								`Batch request to ${config.url} failed [${methods}]`,
							),
						);
					}),
					Effect.retry(retrySchedule),
				);
			});

	if (config.batch) {
		return Layer.scoped(
			TransportService,
			Effect.gen(function* () {
				const httpClient = yield* HttpClient.HttpClient;
				const scheduler = yield* createBatchScheduler(
					sendBatch(httpClient),
					config.batch!,
				);

				return {
					request: <T>(
						method: string,
						params: unknown[] = [],
					): Effect.Effect<T, TransportError> =>
						Effect.gen(function* () {
							const request = yield* applyRequestHooks({ method, params });
							const startTime = Date.now();
							const result = yield* scheduler.schedule<T>(request.method, [
								...request.params,
							]);
							const response = yield* applyResponseHooks({
								method: request.method,
								params: request.params,
								result,
								duration: Date.now() - startTime,
							});
							return response.result as T;
						}).pipe(
							Effect.mapError((e) => {
								if (e instanceof TransportError) return e;
								return new TransportError({
									code: -32603,
									message: `${method} failed: ${e.message}`,
									cause: e,
								});
							}),
						),
				};
			}),
		);
	}

	return Layer.effect(
		TransportService,
		Effect.gen(function* () {
			const httpClient = yield* HttpClient.HttpClient;

			return TransportService.of({
				request: <T>(
					method: string,
					params: unknown[] = [],
				): Effect.Effect<T, TransportError> =>
					Effect.gen(function* () {
						const timeoutOverride = yield* FiberRef.get(timeoutRef);
						const retryOverride = yield* FiberRef.get(retryCountRef);
						const tracingEnabled = yield* FiberRef.get(tracingRef);
						const timeoutMs = timeoutOverride ?? config.timeout;
						const retrySchedule = makeRetrySchedule(
							retryOverride ?? config.retries,
						);
						const request = yield* applyRequestHooks({ method, params });
						const startTime = Date.now();
						const id = yield* nextId;
						const body = JSON.stringify({
							jsonrpc: "2.0",
							id,
							method: request.method,
							params: request.params,
						});
						if (tracingEnabled) {
							yield* Effect.logDebug(`rpc ${request.method} -> ${config.url}`);
						}
						const result = yield* doRequest<T>(
							httpClient,
							body,
							timeoutMs,
							retrySchedule,
							request.method,
						);
						if (tracingEnabled) {
							yield* Effect.logDebug(
								`rpc ${request.method} ok (${Date.now() - startTime}ms)`,
							);
						}
						const response = yield* applyResponseHooks({
							method: request.method,
							params: request.params,
							result,
							duration: Date.now() - startTime,
						});
						return response.result as T;
					}),
			});
		}),
	);
};

/**
 * Creates an HTTP transport layer with FetchHttpClient bundled.
 *
 * @description
 * Convenience function that creates an HttpTransport with FetchHttpClient
 * already provided. This is useful for most use cases where you want to use
 * the standard fetch-based HTTP client without explicitly providing it.
 *
 * For Node.js, you may prefer using `HttpTransport` with `NodeHttpClient.layer`
 * for better performance with keepalive connections.
 *
 * @param options - URL string or configuration object
 * @returns Layer providing TransportService with no additional requirements
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { HttpTransportFetch, TransportService } from 'voltaire-effect/services'
 *
 * const transport = HttpTransportFetch('https://mainnet.infura.io/v3/YOUR_KEY')
 *
 * const program = Effect.gen(function* () {
 *   const t = yield* TransportService
 *   return yield* t.request<string>('eth_blockNumber')
 * }).pipe(Effect.provide(transport))
 *
 * await Effect.runPromise(program)
 * ```
 */
export const HttpTransportFetch = (
	options: HttpTransportConfig | string,
): Layer.Layer<TransportService> =>
	Layer.provide(HttpTransport(options), FetchHttpClient.layer);
