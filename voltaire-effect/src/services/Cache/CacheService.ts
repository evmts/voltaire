/**
 * @fileoverview Cache service definition for key-value caching operations.
 *
 * @module CacheService
 * @since 0.0.1
 *
 * @description
 * The CacheService provides a generic interface for caching values with optional TTL.
 * It abstracts away the underlying cache implementation, allowing for different
 * backends (in-memory, Redis, etc.) to be swapped transparently.
 *
 * @see {@link MemoryCache} - In-memory LRU cache implementation
 * @see {@link NoopCache} - No-op implementation for testing/disabling cache
 */

import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type * as Option from "effect/Option";

/**
 * Shape of the cache service.
 *
 * @description
 * Defines all caching operations available through CacheService.
 * The cache is generic and can store any serializable value type.
 *
 * @since 0.0.1
 */
export type CacheShape = {
	/**
	 * Gets a value from the cache by key.
	 *
	 * @param key - The cache key to look up
	 * @returns Option.some(value) if found and not expired, Option.none() otherwise
	 */
	readonly get: <T>(key: string) => Effect.Effect<Option.Option<T>>;

	/**
	 * Sets a value in the cache.
	 *
	 * @param key - The cache key
	 * @param value - The value to cache
	 * @param ttlMs - Optional time-to-live in milliseconds (undefined = no expiration)
	 */
	readonly set: <T>(
		key: string,
		value: T,
		ttlMs?: number,
	) => Effect.Effect<void>;

	/**
	 * Deletes a value from the cache.
	 *
	 * @param key - The cache key to delete
	 * @returns true if the key existed and was deleted, false otherwise
	 */
	readonly delete: (key: string) => Effect.Effect<boolean>;

	/**
	 * Clears all values from the cache.
	 */
	readonly clear: () => Effect.Effect<void>;
};

/**
 * Cache service for key-value caching with optional TTL.
 *
 * @description
 * Provides methods for getting, setting, and deleting cached values.
 * This is an Effect Context.Tag that must be provided with a concrete
 * implementation (MemoryCache, NoopCache, etc.) before running.
 *
 * @since 0.0.1
 *
 * @example Basic usage with MemoryCache
 * ```typescript
 * import { Effect } from 'effect'
 * import { CacheService, MemoryCache } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const cache = yield* CacheService
 *
 *   // Set a value with 5 minute TTL
 *   yield* cache.set('user:123', { name: 'Alice' }, 5 * 60 * 1000)
 *
 *   // Get the value back
 *   const user = yield* cache.get('user:123')
 *
 *   return user
 * }).pipe(
 *   Effect.provide(MemoryCache({ maxSize: 1000 }))
 * )
 * ```
 *
 * @see {@link MemoryCache} - In-memory LRU cache implementation
 * @see {@link NoopCache} - No-op implementation for testing/disabling cache
 * @see {@link CacheShape} - The service interface shape
 */
export class CacheService extends Context.Tag("CacheService")<
	CacheService,
	CacheShape
>() {}
