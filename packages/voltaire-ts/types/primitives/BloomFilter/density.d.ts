/**
 * Calculate density (percentage of bits set) in bloom filter
 *
 * @param {import('./BloomFilterType.js').BloomFilterType} filter - Bloom filter
 * @returns {number} Density as value between 0 and 1
 *
 * @example
 * ```typescript
 * const filter = BloomFilter.create(2048, 3);
 * BloomFilter.add(filter, "test");
 * const d = BloomFilter.density(filter); // 0.00146484375 (3/2048)
 * ```
 */
export function density(filter: import("./BloomFilterType.js").BloomFilterType): number;
//# sourceMappingURL=density.d.ts.map