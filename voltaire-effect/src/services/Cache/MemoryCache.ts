/**
 * @fileoverview In-memory LRU cache implementation for CacheService.
 *
 * @module MemoryCache
 * @since 0.0.1
 *
 * @description
 * Provides an in-memory cache with LRU eviction and optional TTL support.
 * Uses a Map internally with entry timestamps for expiration tracking.
 *
 * Features:
 * - LRU eviction when max size is reached
 * - Per-entry TTL support (or default TTL)
 * - O(1) get/set operations
 *
 * Why not effect/Cache?
 * effect/Cache is designed for lookup-based caching where you provide a
 * lookup function that computes values on cache miss. CacheService needs
 * explicit get/set semantics where values are set manually, not computed.
 * For lookup-based caching, use LookupCacheService instead.
 *
 * @see {@link CacheService} - The cache service interface
 * @see {@link NoopCache} - No-op implementation for testing
 * @see {@link LookupCacheService} - Lookup-based cache using effect/Cache
 */

import * as Clock from "effect/Clock";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as SynchronizedRef from "effect/SynchronizedRef";
import { CacheService } from "./CacheService.js";

/**
 * Cache entry with value and expiration timestamp.
 */
interface CacheEntry<T> {
	readonly value: T;
	readonly expiresAt: number | undefined;
	readonly createdAt: number;
}

/**
 * Options for configuring the in-memory cache.
 *
 * @since 0.0.1
 */
export interface MemoryCacheOptions {
	/**
	 * Maximum number of entries in the cache.
	 * When exceeded, oldest entries are evicted.
	 * @default 1000
	 */
	readonly maxSize?: number;

	/**
	 * Default TTL in milliseconds for entries without explicit TTL.
	 * @default undefined (no expiration)
	 */
	readonly defaultTtl?: number;
}

/**
 * Creates an in-memory LRU cache layer.
 *
 * @description
 * Returns a Layer that provides CacheService with an in-memory implementation.
 * The cache uses LRU eviction when the max size is reached and supports
 * per-entry TTL with optional default TTL.
 *
 * @param options - Cache configuration options
 * @returns A Layer providing CacheService
 *
 * @since 0.0.1
 *
 * @example Basic usage
 * ```typescript
 * import { Effect } from 'effect'
 * import { CacheService, MemoryCache } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const cache = yield* CacheService
 *   yield* cache.set('key', 'value')
 *   return yield* cache.get('key')
 * }).pipe(
 *   Effect.provide(MemoryCache())
 * )
 * ```
 *
 * @example With custom options
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const cache = yield* CacheService
 *   // All entries expire in 5 minutes by default
 *   yield* cache.set('key', 'value')
 *   // Override with 1 hour TTL
 *   yield* cache.set('key2', 'value2', 60 * 60 * 1000)
 *   return yield* cache.get('key')
 * }).pipe(
 *   Effect.provide(MemoryCache({
 *     maxSize: 500,
 *     defaultTtl: 5 * 60 * 1000
 *   }))
 * )
 * ```
 */
export const MemoryCache = (
	options?: MemoryCacheOptions,
): Layer.Layer<CacheService> => {
	const maxSize = options?.maxSize ?? 1000;
	const defaultTtl = options?.defaultTtl;

	return Layer.effect(
		CacheService,
		Effect.gen(function* () {
			const cacheRef = yield* SynchronizedRef.make(
				new Map<string, CacheEntry<unknown>>(),
			);

			return CacheService.of({
				get: <T>(key: string) =>
					SynchronizedRef.modifyEffect(cacheRef, (cache) =>
						Effect.gen(function* () {
							const entry = cache.get(key) as CacheEntry<T> | undefined;
							if (!entry) return [Option.none<T>(), cache];

							const now = yield* Clock.currentTimeMillis;
							if (entry.expiresAt !== undefined && now > entry.expiresAt) {
								const newCache = new Map(cache);
								newCache.delete(key);
								return [Option.none<T>(), newCache];
							}

							const newCache = new Map(cache);
							newCache.delete(key);
							newCache.set(key, entry);
							return [Option.some(entry.value), newCache];
						}),
					),

				set: <T>(key: string, value: T, ttlMs?: number) =>
					SynchronizedRef.updateEffect(cacheRef, (cache) =>
						Effect.gen(function* () {
							const ttl = ttlMs ?? defaultTtl;
							const now = yield* Clock.currentTimeMillis;
							const newCache = new Map(cache);

							if (newCache.size >= maxSize && !newCache.has(key)) {
								const oldestKey = newCache.keys().next().value;
								if (oldestKey !== undefined) newCache.delete(oldestKey);
							}

							newCache.delete(key);
							newCache.set(key, {
								value,
								expiresAt: ttl !== undefined ? now + ttl : undefined,
								createdAt: now,
							});
							return newCache;
						}),
					),

				delete: (key: string) =>
					SynchronizedRef.modify(cacheRef, (cache) => {
						const existed = cache.has(key);
						const newCache = new Map(cache);
						newCache.delete(key);
						return [existed, newCache];
					}),

				clear: () => SynchronizedRef.set(cacheRef, new Map()),
			});
		}),
	);
};
