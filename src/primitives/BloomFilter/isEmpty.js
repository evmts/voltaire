/**
 * Check if bloom filter is empty (all bits are 0)
 *
 * @param {import('./BrandedBloomFilter.js').BrandedBloomFilter} filter - Bloom filter
 * @returns {boolean} True if filter is empty
 *
 * @example
 * ```typescript
 * const filter = BloomFilter.create(2048, 3);
 * console.log(BloomFilter.isEmpty(filter)); // true
 * ```
 */
export function isEmpty(filter) {
	for (let i = 0; i < filter.length; i++) {
		if (filter[i] !== 0) {
			return false;
		}
	}
	return true;
}
