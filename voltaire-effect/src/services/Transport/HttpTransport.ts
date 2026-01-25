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
 * - Proper JSON-RPC error handling
 *
 * @see {@link TransportService} - The service interface this implements
 * @see {@link WebSocketTransport} - Alternative for real-time subscriptions
 * @see {@link BrowserTransport} - Alternative for browser wallet interaction
 */

import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Ref from "effect/Ref";
import * as Schedule from "effect/Schedule";
import { type BatchOptions, createBatchScheduler } from "./BatchScheduler.js";
import { TransportError } from "./TransportError.js";
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
interface HttpTransportConfig {
	/** The JSON-RPC endpoint URL (must be HTTPS for production) */
	url: string;
	/** Optional custom headers to include in requests (e.g., API keys) */
	headers?: Record<string, string>;
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
 * automatic retries, timeouts, and custom headers. Uses the Fetch API
 * internally for cross-platform compatibility.
 *
 * The transport automatically:
 * - Retries failed requests (configurable)
 * - Times out long-running requests
 * - Parses JSON-RPC responses and extracts errors
 * - Handles network errors gracefully
 *
 * @param options - URL string or configuration object
 * @returns Layer providing TransportService
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
 * import { HttpTransport, TransportService } from 'voltaire-effect/services'
 *
 * const transport = HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY')
 *
 * const program = Effect.gen(function* () {
 *   const t = yield* TransportService
 *   return yield* t.request<string>('eth_blockNumber')
 * }).pipe(Effect.provide(transport))
 * ```
 *
 * @example Full configuration with retries and timeout
 * ```typescript
 * import { Effect } from 'effect'
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
 *   Effect.provide(transport)
 * )
 *
 * await Effect.runPromise(program)
 * ```
 *
 * @example Error handling
 * ```typescript
 * import { Effect } from 'effect'
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
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 *
 * @see {@link TransportService} - The service interface
 * @see {@link TransportError} - Error type thrown on failure
 * @see {@link WebSocketTransport} - For real-time subscriptions
 */
export const HttpTransport = (
	options: HttpTransportConfig | string,
): Layer.Layer<TransportService> => {
	const config =
		typeof options === "string"
			? { url: options, timeout: 30000, retries: 3, retryDelay: 1000, batch: undefined as BatchOptions | undefined }
			: {
					url: options.url,
					headers: options.headers,
					timeout: options.timeout ?? 30000,
					retries: options.retries ?? 3,
					retryDelay: options.retryDelay ?? 1000,
					batch: options.batch,
				};

	const toTransportError = (e: unknown): TransportError => {
		if (e instanceof TransportError) return e;
		return new TransportError({
			code: -32603,
			message: e instanceof Error ? e.message : "Network error",
		});
	};

	const doFetch = <T>(
		body: string,
		headers: Record<string, string>,
	): Effect.Effect<T, TransportError> =>
		Effect.acquireRelease(
			Effect.sync(() => new AbortController()),
			(controller) => Effect.sync(() => controller.abort()),
		).pipe(
			Effect.flatMap((controller) =>
				Effect.tryPromise({
					try: () =>
						fetch(config.url, {
							method: "POST",
							headers,
							body,
							signal: controller.signal,
						}),
					catch: toTransportError,
				}),
			),
			Effect.flatMap((response) =>
				response.ok
					? Effect.tryPromise({
							try: () => response.json() as Promise<JsonRpcResponse<T>>,
							catch: toTransportError,
						})
					: Effect.fail(
							new TransportError({
								code: -32603,
								message: `HTTP ${response.status}: ${response.statusText}`,
							}),
						),
			),
			Effect.flatMap((json) =>
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
			Effect.timeoutFail({
				duration: Duration.millis(config.timeout),
				onTimeout: () =>
					new TransportError({
						code: -32603,
						message: `Request timeout after ${config.timeout}ms`,
					}),
			}),
			Effect.scoped,
		);

	const retrySchedule = Schedule.recurs(config.retries).pipe(
		Schedule.intersect(Schedule.spaced(Duration.millis(config.retryDelay))),
	);

	interface JsonRpcBatchResponse {
		id: number;
		result?: unknown;
		error?: { code: number; message: string; data?: unknown };
	}

	const sendBatch = (
		requests: Array<{ id: number; method: string; params?: unknown[] }>,
	): Effect.Effect<JsonRpcBatchResponse[], Error> => {
		const body = JSON.stringify(
			requests.map((r) => ({
				jsonrpc: "2.0",
				id: r.id,
				method: r.method,
				params: r.params ?? [],
			})),
		);
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			...config.headers,
		};

		return Effect.acquireRelease(
			Effect.sync(() => new AbortController()),
			(controller) => Effect.sync(() => controller.abort()),
		).pipe(
			Effect.flatMap((controller) =>
				Effect.tryPromise({
					try: () =>
						fetch(config.url, {
							method: "POST",
							headers,
							body,
							signal: controller.signal,
						}),
					catch: (e) => new Error(e instanceof Error ? e.message : "Network error"),
				}),
			),
			Effect.flatMap((response) =>
				response.ok
					? Effect.tryPromise({
							try: () => response.json() as Promise<JsonRpcBatchResponse[]>,
							catch: (e) => new Error(e instanceof Error ? e.message : "Parse error"),
						})
					: Effect.fail(new Error(`HTTP ${response.status}: ${response.statusText}`)),
			),
			Effect.timeoutFail({
				duration: Duration.millis(config.timeout),
				onTimeout: () => new Error(`Request timeout after ${config.timeout}ms`),
			}),
			Effect.retry(retrySchedule),
			Effect.scoped,
		);
	};

	if (config.batch) {
		const scheduler = createBatchScheduler(sendBatch, config.batch);

		return Layer.succeed(TransportService, {
			request: <T>(
				method: string,
				params: unknown[] = [],
			): Effect.Effect<T, TransportError> =>
				scheduler.schedule<T>(method, params).pipe(
					Effect.mapError((e) =>
						new TransportError({
							code: -32603,
							message: e.message,
						}),
					),
				),
		});
	}

	return Layer.effect(
		TransportService,
		Effect.gen(function* () {
			const requestIdRef = yield* Ref.make(0);

			return TransportService.of({
				request: <T>(
					method: string,
					params: unknown[] = [],
				): Effect.Effect<T, TransportError> =>
					Ref.updateAndGet(requestIdRef, (n) => n + 1).pipe(
						Effect.map((id) =>
							JSON.stringify({ jsonrpc: "2.0", id, method, params }),
						),
						Effect.flatMap((body) => {
							const headers: Record<string, string> = {
								"Content-Type": "application/json",
								...config.headers,
							};
							return doFetch<T>(body, headers);
						}),
						Effect.retry(retrySchedule),
					),
			});
		}),
	);
};
