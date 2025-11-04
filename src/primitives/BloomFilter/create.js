import { SIZE } from "./constants.js";
import { InvalidBloomFilterParameterError } from "./errors.js";

/**
 * Create a new BloomFilter
 *
 * @param {number} m - Number of bits in the filter
 * @param {number} k - Number of hash functions
 * @returns {import('./BrandedBloomFilter.js').BrandedBloomFilter} BloomFilter
 * @throws {InvalidBloomFilterParameterError} If parameters are invalid
 *
 * @example
 * ```typescript
 * const filter = BloomFilter.create(2048, 3);
 * ```
 */
export function create(m, k) {
	if (m <= 0 || k <= 0) {
		throw new InvalidBloomFilterParameterError(
			"Bloom filter parameters must be positive",
		);
	}
	const bytes = Math.ceil(m / 8);
	const filter = new Uint8Array(bytes);
	Object.defineProperty(filter, "k", {
		value: k,
		writable: false,
		enumerable: true,
	});
	Object.defineProperty(filter, "m", {
		value: m,
		writable: false,
		enumerable: true,
	});
	Object.defineProperty(filter, "__tag", {
		value: "BloomFilter",
		writable: false,
		enumerable: false,
	});
	return filter;
}
