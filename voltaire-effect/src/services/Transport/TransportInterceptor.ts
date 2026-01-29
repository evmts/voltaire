/**
 * @fileoverview FiberRef-based request/response interceptors and deduplication.
 *
 * @module TransportInterceptor
 * @since 0.0.1
 *
 * @description
 * Provides FiberRef-based interceptors for transport requests and responses.
 * Also provides request deduplication to avoid redundant identical requests.
 *
 * Features:
 * - FiberRef-based request interceptor (called before each request)
 * - FiberRef-based response interceptor (called after each request)
 * - Request deduplication via Effect.cached patterns
 * - Composable with any transport implementation
 *
 * @see {@link TransportService} - The service these intercept
 * @see {@link HttpTransport} - Common transport to intercept
 */

import * as Deferred from "effect/Deferred";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as FiberRef from "effect/FiberRef";
import * as Layer from "effect/Layer";
import * as Ref from "effect/Ref";
import * as Schedule from "effect/Schedule";
import { cacheEnabledRef } from "./config.js";
import { TransportError } from "./TransportError.js";
import { TransportService, type TransportShape } from "./TransportService.js";

/**
 * RPC request structure for interceptors.
 *
 * @since 0.0.1
 */
export interface RpcRequest {
	/** JSON-RPC method name */
	readonly method: string;
	/** Method parameters */
	readonly params: readonly unknown[];
}

/**
 * RPC response structure for interceptors.
 *
 * @since 0.0.1
 */
export interface RpcResponse<T = unknown> {
	/** JSON-RPC method name */
	readonly method: string;
	/** Method parameters */
	readonly params: readonly unknown[];
	/** Response result (if successful) */
	readonly result: T;
	/** Response time in milliseconds */
	readonly duration: number;
}

/**
 * RPC error structure for interceptors.
 *
 * @since 0.0.1
 */
export interface RpcError {
	/** JSON-RPC method name */
	readonly method: string;
	/** Method parameters */
	readonly params: readonly unknown[];
	/** The transport error */
	readonly error: TransportError;
	/** Time until error in milliseconds */
	readonly duration: number;
}

/**
 * Request interceptor type.
 * Called before each request. Return the (possibly modified) request.
 *
 * @since 0.0.1
 */
export type RequestInterceptor = (
	request: RpcRequest,
) => Effect.Effect<RpcRequest>;

/**
 * Response interceptor type.
 * Called after each successful request. Return the (possibly modified) response.
 *
 * @since 0.0.1
 */
export type ResponseInterceptor = <T>(
	response: RpcResponse<T>,
) => Effect.Effect<RpcResponse<T>>;

/**
 * Error interceptor type.
 * Called after each failed request. Can be used for logging or error reporting.
 *
 * @since 0.0.1
 */
export type ErrorInterceptor = (error: RpcError) => Effect.Effect<void>;

/**
 * FiberRef for request interceptor.
 * Default: no-op interceptor.
 *
 * @since 0.0.1
 */
export const onRequestRef: FiberRef.FiberRef<RequestInterceptor> =
	FiberRef.unsafeMake<RequestInterceptor>((request) => Effect.succeed(request));

/**
 * FiberRef for response interceptor.
 * Default: no-op interceptor.
 *
 * @since 0.0.1
 */
export const onResponseRef: FiberRef.FiberRef<ResponseInterceptor> =
	FiberRef.unsafeMake<ResponseInterceptor>(<T>(response: RpcResponse<T>) =>
		Effect.succeed(response),
	);

/**
 * FiberRef for error interceptor.
 * Default: no-op interceptor.
 *
 * @since 0.0.1
 */
export const onErrorRef: FiberRef.FiberRef<ErrorInterceptor> =
	FiberRef.unsafeMake<ErrorInterceptor>(() => Effect.void);

/**
 * Run an effect with a request interceptor.
 *
 * @description
 * Sets the request interceptor for the current fiber scope.
 * The interceptor will be called before each transport request.
 *
 * @param interceptor - The request interceptor to use
 * @returns Function that wraps an effect with the interceptor
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { withRequestInterceptor, TransportService } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const transport = yield* TransportService
 *   return yield* transport.request('eth_blockNumber')
 * }).pipe(
 *   withRequestInterceptor((req) =>
 *     Effect.sync(() => {
 *       console.log(`-> ${req.method}`)
 *       return req
 *     })
 *   )
 * )
 * ```
 */
export const withRequestInterceptor =
	(interceptor: RequestInterceptor) =>
	<A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
		Effect.locally(effect, onRequestRef, interceptor);

/**
 * Run an effect with a response interceptor.
 *
 * @description
 * Sets the response interceptor for the current fiber scope.
 * The interceptor will be called after each successful transport request.
 *
 * @param interceptor - The response interceptor to use
 * @returns Function that wraps an effect with the interceptor
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { withResponseInterceptor, TransportService } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const transport = yield* TransportService
 *   return yield* transport.request('eth_blockNumber')
 * }).pipe(
 *   withResponseInterceptor((res) =>
 *     Effect.sync(() => {
 *       console.log(`<- ${res.method}: ${res.duration}ms`)
 *       return res
 *     })
 *   )
 * )
 * ```
 */
export const withResponseInterceptor =
	(interceptor: ResponseInterceptor) =>
	<A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
		Effect.locally(effect, onResponseRef, interceptor);

/**
 * Run an effect with an error interceptor.
 *
 * @description
 * Sets the error interceptor for the current fiber scope.
 * The interceptor will be called after each failed transport request.
 *
 * @param interceptor - The error interceptor to use
 * @returns Function that wraps an effect with the interceptor
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { withErrorInterceptor, TransportService } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const transport = yield* TransportService
 *   return yield* transport.request('eth_call', [{ to: '0x...' }])
 * }).pipe(
 *   withErrorInterceptor((err) =>
 *     Effect.sync(() => console.error(`!! ${err.method}: ${err.error.message}`))
 *   )
 * )
 * ```
 */
export const withErrorInterceptor =
	(interceptor: ErrorInterceptor) =>
	<A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
		Effect.locally(effect, onErrorRef, interceptor);

/**
 * Run an effect with all interceptors.
 *
 * @since 0.0.1
 */
export const withInterceptors =
	(options: {
		onRequest?: RequestInterceptor;
		onResponse?: ResponseInterceptor;
		onError?: ErrorInterceptor;
	}) =>
	<A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> => {
		let result = effect;
		if (options.onRequest) {
			result = Effect.locally(result, onRequestRef, options.onRequest);
		}
		if (options.onResponse) {
			result = Effect.locally(result, onResponseRef, options.onResponse);
		}
		if (options.onError) {
			result = Effect.locally(result, onErrorRef, options.onError);
		}
		return result;
	};

/**
 * Creates a transport wrapper that applies FiberRef interceptors.
 *
 * @description
 * Wraps an existing TransportService layer to add interceptor support.
 * The interceptors are read from FiberRefs, allowing them to be set
 * per-fiber using the `withXxxInterceptor` helpers.
 *
 * @param baseTransport - The transport layer to wrap
 * @returns Layer with interceptor support
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import {
 *   HttpTransport,
 *   InterceptedTransport,
 *   withRequestInterceptor,
 *   TransportService
 * } from 'voltaire-effect'
 *
 * const transport = InterceptedTransport(
 *   HttpTransport('https://mainnet.infura.io/v3/KEY')
 * )
 *
 * const program = Effect.gen(function* () {
 *   const t = yield* TransportService
 *   return yield* t.request('eth_blockNumber')
 * }).pipe(
 *   Effect.provide(transport),
 *   withRequestInterceptor((req) =>
 *     Effect.sync(() => {
 *       console.log('Request:', req.method)
 *       return req
 *     })
 *   )
 * )
 * ```
 */
export const InterceptedTransport = <E, R>(
	baseTransport: Layer.Layer<TransportService, E, R>,
): Layer.Layer<TransportService, E, R> =>
	Layer.flatMap(baseTransport, (context) =>
		Layer.succeed(
			TransportService,
			TransportService.of({
				request: <T>(method: string, params: unknown[] = []) =>
					Effect.gen(function* () {
						const base = context.unsafeMap.get(
							TransportService.key,
						) as TransportShape;
						const onRequest = yield* FiberRef.get(onRequestRef);
						const onResponse = yield* FiberRef.get(onResponseRef);
						const onError = yield* FiberRef.get(onErrorRef);

						const request = yield* onRequest({ method, params });

						const startTime = Date.now();

						const result = yield* base
							.request<T>(request.method, [...request.params])
							.pipe(
								Effect.tapError((error) => {
									if (error instanceof TransportError) {
										const duration = Date.now() - startTime;
										return onError({
											method: request.method,
											params: request.params,
											error,
											duration,
										});
									}
									return Effect.void;
								}),
							);

						const response = yield* onResponse({
							method: request.method,
							params: request.params,
							result,
							duration: Date.now() - startTime,
						});

						return response.result as T;
					}),
			}),
		),
	);

/**
 * Deduplication cache entry.
 */
interface CacheEntry<T> {
	deferred: Deferred.Deferred<T, TransportError>;
	timestamp: number;
}

/**
 * Configuration for request deduplication.
 *
 * @since 0.0.1
 */
export interface DeduplicationConfig {
	/** Cache TTL in milliseconds (default: 1000) */
	ttl?: number;
	/** Methods to deduplicate (default: all methods) */
	methods?: string[];
	/** Methods to exclude from deduplication */
	excludeMethods?: string[];
}

/**
 * Creates a cache key for a request.
 */
const makeCacheKey = (method: string, params: unknown[]): string =>
	`${method}:${JSON.stringify(params)}`;

/**
 * Creates a transport wrapper with request deduplication.
 *
 * @description
 * Wraps an existing TransportService layer to add request deduplication.
 * Identical concurrent requests will share the same response, avoiding
 * redundant RPC calls.
 *
 * @param baseTransport - The transport layer to wrap
 * @param config - Deduplication configuration
 * @returns Layer with deduplication support
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import {
 *   HttpTransport,
 *   DeduplicatedTransport,
 *   TransportService
 * } from 'voltaire-effect'
 *
 * const transport = DeduplicatedTransport(
 *   HttpTransport('https://mainnet.infura.io/v3/KEY'),
 *   { ttl: 500 } // Cache for 500ms
 * )
 *
 * const program = Effect.gen(function* () {
 *   const t = yield* TransportService
 *
 *   // These will share the same request
 *   const { a, b } = yield* Effect.all({
 *     a: t.request('eth_blockNumber'),
 *     b: t.request('eth_blockNumber'),
 *   }, { concurrency: 'unbounded' })
 *
 *   return { a, b }
 * }).pipe(Effect.provide(transport))
 * ```
 */
export const DeduplicatedTransport = <E, R>(
	baseTransport: Layer.Layer<TransportService, E, R>,
	config: DeduplicationConfig = {},
): Layer.Layer<TransportService, E, R> => {
	const ttl = config.ttl ?? 1000;
	const methodSet = config.methods ? new Set(config.methods) : null;
	const excludeSet = config.excludeMethods
		? new Set(config.excludeMethods)
		: null;

	const shouldDedupe = (method: string): boolean => {
		if (excludeSet?.has(method)) return false;
		if (methodSet && !methodSet.has(method)) return false;
		return true;
	};

	return Layer.flatMap(baseTransport, (context) =>
		Layer.scoped(
			TransportService,
			Effect.gen(function* () {
				const base = context.unsafeMap.get(
					TransportService.key,
				) as TransportShape;
				const cacheRef = yield* Ref.make<Map<string, CacheEntry<unknown>>>(
					new Map(),
				);

				// Cleanup expired entries periodically
				const cleanup = Effect.gen(function* () {
					const now = Date.now();
					yield* Ref.update(cacheRef, (cache) => {
						const newCache = new Map(cache);
						for (const [key, entry] of newCache) {
							if (now - entry.timestamp > ttl) {
								newCache.delete(key);
							}
						}
						return newCache;
					});
				});

				yield* cleanup.pipe(
					Effect.repeat({ schedule: Schedule.spaced(Duration.millis(ttl)) }),
					Effect.fork,
				);

				return TransportService.of({
					request: <T>(method: string, params: unknown[] = []) =>
						Effect.gen(function* () {
							const cacheEnabled = yield* FiberRef.get(cacheEnabledRef);
							if (!cacheEnabled) {
								return yield* base.request<T>(method, params);
							}
							if (!shouldDedupe(method)) {
								return yield* base.request<T>(method, params);
							}

							const key = makeCacheKey(method, params);
							const now = Date.now();

							// Check if we have a valid cached request in flight
							const cache = yield* Ref.get(cacheRef);
							const existing = cache.get(key);

							if (existing && now - existing.timestamp < ttl) {
								// Wait for the existing request
								return (yield* Deferred.await(existing.deferred)) as T;
							}

							// Create a new deferred for this request
							const deferred = yield* Deferred.make<unknown, TransportError>();

							yield* Ref.update(cacheRef, (c) => {
								const newCache = new Map(c);
								newCache.set(key, { deferred, timestamp: now });
								return newCache;
							});

							// Make the actual request and complete the deferred
							const result = yield* base.request<T>(method, params).pipe(
								Effect.tap((result) => Deferred.succeed(deferred, result)),
								Effect.tapError((error) => {
									if (error instanceof TransportError) {
										return Deferred.fail(deferred, error);
									}
									return Effect.void;
								}),
								Effect.onInterrupt(() =>
									Effect.gen(function* () {
										yield* Ref.update(cacheRef, (c) => {
											const newCache = new Map(c);
											newCache.delete(key);
											return newCache;
										});
										yield* Deferred.fail(
											deferred,
											new TransportError({
												code: -32603,
												message: "Request interrupted",
											}),
										);
									}),
								),
							);

							return result;
						}),
				});
			}),
		),
	);
};
