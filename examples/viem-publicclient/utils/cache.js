/**
 * Caching Utilities
 *
 * Simple in-memory cache with expiration.
 *
 * @module examples/viem-publicclient/utils/cache
 */

/** @type {Map<string, { value: unknown; expires: number }>} */
const cache = new Map();

/**
 * Get cached value
 *
 * @param {string} key - Cache key
 * @returns {{ value: unknown } | undefined} Cached entry or undefined
 */
export function getCache(key) {
	const entry = cache.get(key);
	if (!entry) return undefined;
	if (Date.now() > entry.expires) {
		cache.delete(key);
		return undefined;
	}
	return { value: entry.value };
}

/**
 * Set cached value
 *
 * @param {string} key - Cache key
 * @param {unknown} value - Value to cache
 * @param {number} cacheTime - Cache duration in ms
 */
export function setCache(key, value, cacheTime) {
	cache.set(key, {
		value,
		expires: Date.now() + cacheTime,
	});
}

/**
 * Execute function with caching
 *
 * @template T
 * @param {() => Promise<T>} fn - Function to execute
 * @param {{ cacheKey: string; cacheTime: number }} options - Cache options
 * @returns {Promise<T>} Cached or fresh result
 */
export async function withCache(fn, { cacheKey, cacheTime }) {
	const cached = getCache(cacheKey);
	if (cached) return /** @type {T} */ (cached.value);

	const result = await fn();
	setCache(cacheKey, result, cacheTime);
	return result;
}

/**
 * Clear entire cache
 */
export function clearCache() {
	cache.clear();
}
