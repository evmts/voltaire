/**
 * Convert bloom filter to hex string
 *
 * @param {import('./BrandedBloomFilter.js').BrandedBloomFilter} filter - Bloom filter
 * @returns {string} Hex string representation
 *
 * @example
 * ```typescript
 * const filter = BloomFilter.create(2048, 3);
 * const hex = BloomFilter.toHex(filter);
 * ```
 */
export function toHex(filter) {
	return `0x${Array.from(filter)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
}
