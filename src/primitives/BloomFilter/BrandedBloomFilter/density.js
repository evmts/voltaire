/**
 * Calculate density (percentage of bits set) in bloom filter
 *
 * @param {import('./BrandedBloomFilter.ts').BrandedBloomFilter} filter - Bloom filter
 * @returns {number} Density as value between 0 and 1
 *
 * @example
 * ```typescript
 * const filter = BloomFilter.create(2048, 3);
 * BloomFilter.add(filter, "test");
 * const d = BloomFilter.density(filter); // 0.00146484375 (3/2048)
 * ```
 */
export function density(filter) {
	let bitsSet = 0;
	for (let i = 0; i < filter.length; i++) {
		const byte = filter[i];
		if (byte === undefined) {
			continue;
		}
		// Count set bits in byte
		let b = byte;
		while (b > 0) {
			bitsSet += b & 1;
			b >>= 1;
		}
	}
	const totalBits = filter.m;
	return bitsSet / totalBits;
}
