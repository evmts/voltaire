/**
 * @fileoverview No-op cache implementation for testing or disabling cache.
 *
 * @module NoopCache
 * @since 0.0.1
 *
 * @description
 * Provides a cache implementation that does nothing. Useful for:
 * - Testing code paths without caching interference
 * - Disabling cache in development
 * - Benchmarking without cache effects
 *
 * @see {@link CacheService} - The cache service interface
 * @see {@link MemoryCache} - In-memory cache implementation
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import { CacheService } from "./CacheService.js";

/**
 * No-op cache layer that does not store anything.
 *
 * @description
 * All operations are no-ops:
 * - get() always returns Option.none()
 * - set() does nothing
 * - delete() returns false
 * - clear() does nothing
 *
 * @since 0.0.1
 *
 * @example Testing without cache
 * ```typescript
 * import { Effect } from 'effect'
 * import { CacheService, NoopCache } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const cache = yield* CacheService
 *   yield* cache.set('key', 'value')
 *   // Always returns None - nothing is cached
 *   const result = yield* cache.get('key')
 *   return result // Option.none()
 * }).pipe(
 *   Effect.provide(NoopCache)
 * )
 * ```
 *
 * @example Disabling cache conditionally
 * ```typescript
 * import { Effect, Layer } from 'effect'
 * import { CacheService, MemoryCache, NoopCache } from 'voltaire-effect/services'
 *
 * const cacheLayer = process.env.DISABLE_CACHE
 *   ? NoopCache
 *   : MemoryCache({ maxSize: 1000 })
 *
 * const program = Effect.gen(function* () {
 *   const cache = yield* CacheService
 *   // Works the same regardless of implementation
 *   yield* cache.set('key', 'value')
 *   return yield* cache.get('key')
 * }).pipe(
 *   Effect.provide(cacheLayer)
 * )
 * ```
 */
export const NoopCache: Layer.Layer<CacheService> = Layer.succeed(
	CacheService,
	CacheService.of({
		get: <T>(_key: string) => Effect.succeed(Option.none<T>()),

		set: <T>(_key: string, _value: T, _ttlMs?: number) =>
			Effect.succeed(undefined),

		delete: (_key: string) => Effect.succeed(false),

		clear: () => Effect.succeed(undefined),
	}),
);
