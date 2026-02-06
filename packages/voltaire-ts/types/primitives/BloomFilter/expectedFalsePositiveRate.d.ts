/**
 * Calculate expected false positive rate for a bloom filter
 * Formula: (1 - e^(-k*n/m))^k
 * where k = number of hash functions, n = number of items, m = number of bits
 *
 * @param {import('./BloomFilterType.js').BloomFilterType} filter - Bloom filter
 * @param {number} itemCount - Expected number of items
 * @returns {number} False positive probability (0 to 1)
 *
 * @example
 * ```typescript
 * const filter = BloomFilter.create(2048, 3);
 * const fpr = BloomFilter.expectedFalsePositiveRate(filter, 100); // ~0.0009
 * ```
 */
export function expectedFalsePositiveRate(filter: import("./BloomFilterType.js").BloomFilterType, itemCount: number): number;
//# sourceMappingURL=expectedFalsePositiveRate.d.ts.map