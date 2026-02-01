/**
 * Create a new BloomFilter
 *
 * @param {number} m - Number of bits in the filter
 * @param {number} k - Number of hash functions
 * @returns {import('./BloomFilterType.js').BloomFilterType} BloomFilter
 * @throws {InvalidBloomFilterParameterError} If parameters are invalid
 *
 * @example
 * ```typescript
 * const filter = BloomFilter.create(2048, 3);
 * ```
 */
export function create(m: number, k: number): import("./BloomFilterType.js").BloomFilterType;
//# sourceMappingURL=create.d.ts.map