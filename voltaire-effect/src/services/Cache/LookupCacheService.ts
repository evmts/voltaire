/**
 * @fileoverview Lookup-based cache service using effect/Cache.
 *
 * @module LookupCacheService
 * @since 0.0.1
 *
 * @description
 * Provides a lookup-based caching interface using Effect's built-in Cache module.
 * Unlike CacheService which uses manual get/set, LookupCacheService automatically
 * computes values on cache miss using a provided lookup function.
 *
 * This is the idiomatic Effect pattern for caching: you define a computation
 * that produces a value, and the cache handles memoization, TTL, and LRU eviction.
 *
 * Use LookupCacheService when:
 * - You have a function that computes values (e.g., RPC calls, DB queries)
 * - You want automatic deduplication of concurrent requests for the same key
 * - You want the Effect ecosystem's built-in cache semantics
 *
 * Use CacheService when:
 * - You need explicit get/set control
 * - Values come from external sources (e.g., user input, external APIs)
 * - You're porting code that expects manual cache operations
 *
 * @see {@link CacheService} - Manual get/set cache interface
 * @see {@link MemoryCache} - In-memory implementation of CacheService
 */

import * as Cache from "effect/Cache";
import * as Context from "effect/Context";
import type * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import type * as Option from "effect/Option";

/**
 * Shape of the lookup cache service.
 *
 * @description
 * Wraps effect/Cache with a service interface. The cache is parameterized
 * by Key, Value, and Error types, with automatic lookup on cache miss.
 *
 * @since 0.0.1
 */
export type LookupCacheShape<Key, Value, Error = never> = {
	/**
	 * Gets a value, computing it via the lookup function if not cached.
	 * Concurrent requests for the same key share the same computation.
	 */
	readonly get: (key: Key) => Effect.Effect<Value, Error>;

	/**
	 * Gets a value only if it exists in the cache.
	 * Does not trigger the lookup function.
	 */
	readonly getOption: (key: Key) => Effect.Effect<Option.Option<Value>, Error>;

	/**
	 * Manually sets a value in the cache.
	 */
	readonly set: (key: Key, value: Value) => Effect.Effect<void>;

	/**
	 * Forces recomputation of a value, updating the cache.
	 * Existing cached value remains available during recomputation.
	 */
	readonly refresh: (key: Key) => Effect.Effect<void, Error>;

	/**
	 * Invalidates a specific key.
	 */
	readonly invalidate: (key: Key) => Effect.Effect<void>;

	/**
	 * Invalidates all cached values.
	 */
	readonly invalidateAll: Effect.Effect<void>;

	/**
	 * Returns cache statistics.
	 */
	readonly stats: Effect.Effect<Cache.CacheStats>;

	/**
	 * Returns the approximate number of cached values.
	 */
	readonly size: Effect.Effect<number>;
};

/**
 * Lookup cache service tag.
 *
 * @description
 * Context tag for LookupCacheService. Must be parameterized with Key, Value,
 * and optional Error types when used.
 *
 * @since 0.0.1
 *
 * @example Creating a typed lookup cache
 * ```typescript
 * import { Effect } from 'effect'
 * import { LookupCacheService, makeLookupCache } from 'voltaire-effect'
 *
 * // Define a cache for user lookups
 * const UserCache = LookupCacheService<string, User, UserNotFoundError>()
 *
 * const program = Effect.gen(function* () {
 *   const cache = yield* UserCache
 *   // Automatically fetches from DB if not cached
 *   const user = yield* cache.get('user:123')
 *   return user
 * })
 * ```
 */
export const LookupCacheService = <Key, Value, Error = never>() =>
	Context.GenericTag<LookupCacheShape<Key, Value, Error>>("LookupCacheService");

/**
 * Options for creating a lookup cache.
 *
 * @since 0.0.1
 */
export interface LookupCacheOptions<Key, Value, Error, R> {
	/**
	 * Maximum number of entries in the cache.
	 */
	readonly capacity: number;

	/**
	 * Time-to-live for cached entries.
	 */
	readonly timeToLive: Duration.DurationInput;

	/**
	 * Function to compute values on cache miss.
	 * Receives the key and returns an Effect producing the value.
	 */
	readonly lookup: (key: Key) => Effect.Effect<Value, Error, R>;
}

/**
 * Creates a lookup cache layer.
 *
 * @description
 * Returns a Layer that provides a LookupCacheService backed by effect/Cache.
 * The cache automatically:
 * - Computes values using the lookup function on cache miss
 * - Deduplicates concurrent requests for the same key
 * - Evicts entries based on LRU when capacity is reached
 * - Expires entries after timeToLive
 *
 * @param options - Cache configuration including lookup function
 * @returns A Layer providing the typed LookupCacheService
 *
 * @since 0.0.1
 *
 * @example RPC result caching
 * ```typescript
 * import { Effect, Duration } from 'effect'
 * import { makeLookupCache, LookupCacheService } from 'voltaire-effect'
 *
 * // Define the cache service tag
 * const BlockCache = LookupCacheService<bigint, Block, RpcError>()
 *
 * // Create the layer with lookup function
 * const BlockCacheLayer = makeLookupCache(BlockCache, {
 *   capacity: 1000,
 *   timeToLive: Duration.minutes(5),
 *   lookup: (blockNumber) => rpcClient.getBlock(blockNumber)
 * })
 *
 * const program = Effect.gen(function* () {
 *   const cache = yield* BlockCache
 *   // First call fetches from RPC, subsequent calls return cached
 *   const block = yield* cache.get(123n)
 *   return block
 * }).pipe(
 *   Effect.provide(BlockCacheLayer)
 * )
 * ```
 */
export const makeLookupCache = <Key, Value, Error, R>(
	tag: Context.Tag<
		LookupCacheShape<Key, Value, Error>,
		LookupCacheShape<Key, Value, Error>
	>,
	options: LookupCacheOptions<Key, Value, Error, R>,
): Layer.Layer<LookupCacheShape<Key, Value, Error>, never, R> =>
	Layer.effect(
		tag,
		Effect.gen(function* () {
			const cache = yield* Cache.make({
				capacity: options.capacity,
				timeToLive: options.timeToLive,
				lookup: options.lookup,
			});

			return {
				get: (key: Key) => cache.get(key),
				getOption: (key: Key) => cache.getOption(key),
				set: (key: Key, value: Value) => cache.set(key, value),
				refresh: (key: Key) => cache.refresh(key),
				invalidate: (key: Key) => cache.invalidate(key),
				invalidateAll: cache.invalidateAll,
				stats: cache.cacheStats,
				size: cache.size,
			};
		}),
	);
