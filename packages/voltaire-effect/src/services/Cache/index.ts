/**
 * @fileoverview Cache service module for voltaire-effect.
 *
 * @description
 * Provides caching capabilities for RPC responses and other data
 * to reduce network requests and improve performance.
 *
 * @module Cache
 * @since 0.0.1
 */

import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

/**
 * Shape interface for the Cache service.
 *
 * @since 0.0.1
 */
export interface CacheShape {
	/**
	 * Gets a value from the cache.
	 *
	 * @param key - The cache key
	 * @returns Effect containing the cached value or undefined
	 */
	readonly get: <T>(key: string) => Effect.Effect<T | undefined>;

	/**
	 * Sets a value in the cache.
	 *
	 * @param key - The cache key
	 * @param value - The value to cache
	 * @param ttl - Optional time-to-live in milliseconds
	 * @returns Effect that completes when value is stored
	 */
	readonly set: <T>(key: string, value: T, ttl?: number) => Effect.Effect<void>;

	/**
	 * Deletes a value from the cache.
	 *
	 * @param key - The cache key
	 * @returns Effect that completes when value is deleted
	 */
	readonly delete: (key: string) => Effect.Effect<void>;

	/**
	 * Clears all values from the cache.
	 *
	 * @returns Effect that completes when cache is cleared
	 */
	readonly clear: () => Effect.Effect<void>;
}

/**
 * Cache service for Effect-based applications.
 *
 * @since 0.0.1
 */
export class CacheService extends Context.Tag("CacheService")<
	CacheService,
	CacheShape
>() {}

/**
 * Options for the MemoryCache implementation.
 */
export interface MemoryCacheOptions {
	/**
	 * Default time-to-live in milliseconds.
	 * If not provided, entries never expire.
	 */
	readonly defaultTtl?: number;

	/**
	 * Maximum number of entries in the cache.
	 * If not provided, no limit is enforced.
	 */
	readonly maxEntries?: number;
}

interface CacheEntry<T> {
	value: T;
	expiresAt?: number;
}

/**
 * In-memory cache implementation.
 *
 * @param options - Cache configuration options
 * @returns Layer providing CacheService
 *
 * @since 0.0.1
 */
export const MemoryCache = (
	options: MemoryCacheOptions = {},
): Layer.Layer<CacheService> => {
	const cache = new Map<string, CacheEntry<unknown>>();

	const isExpired = (entry: CacheEntry<unknown>): boolean => {
		if (entry.expiresAt === undefined) return false;
		return Date.now() > entry.expiresAt;
	};

	const cleanup = (): void => {
		for (const [key, entry] of cache.entries()) {
			if (isExpired(entry)) {
				cache.delete(key);
			}
		}
	};

	const enforceMaxEntries = (): void => {
		if (options.maxEntries && cache.size >= options.maxEntries) {
			// Remove oldest entry (first entry in Map)
			const firstKey = cache.keys().next().value;
			if (firstKey !== undefined) {
				cache.delete(firstKey);
			}
		}
	};

	return Layer.succeed(CacheService, {
		get: <T>(key: string) =>
			Effect.sync(() => {
				const entry = cache.get(key) as CacheEntry<T> | undefined;
				if (!entry) return undefined;
				if (isExpired(entry)) {
					cache.delete(key);
					return undefined;
				}
				return entry.value;
			}),

		set: <T>(key: string, value: T, ttl?: number) =>
			Effect.sync(() => {
				cleanup();
				enforceMaxEntries();
				const effectiveTtl = ttl ?? options.defaultTtl;
				const entry: CacheEntry<T> = {
					value,
					expiresAt: effectiveTtl ? Date.now() + effectiveTtl : undefined,
				};
				cache.set(key, entry);
			}),

		delete: (key: string) =>
			Effect.sync(() => {
				cache.delete(key);
			}),

		clear: () =>
			Effect.sync(() => {
				cache.clear();
			}),
	});
};

/**
 * No-op cache implementation that never stores values.
 * Useful for testing or when caching is disabled.
 *
 * @returns Layer providing CacheService
 *
 * @since 0.0.1
 */
export const NoopCache: Layer.Layer<CacheService> = Layer.succeed(
	CacheService,
	{
		get: <T>(_key: string) => Effect.succeed(undefined as T | undefined),
		set: <T>(_key: string, _value: T, _ttl?: number) => Effect.void,
		delete: (_key: string) => Effect.void,
		clear: () => Effect.void,
	},
);
