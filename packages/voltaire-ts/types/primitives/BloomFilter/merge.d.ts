/**
 * Merge two bloom filters using bitwise OR
 * Both filters must have same size and hash count
 *
 * @param {import('./BloomFilterType.js').BloomFilterType} filter1 - First bloom filter
 * @param {import('./BloomFilterType.js').BloomFilterType} filter2 - Second bloom filter
 * @returns {import('./BloomFilterType.js').BloomFilterType} Merged bloom filter
 * @throws {InvalidBloomFilterParameterError} If filters have different parameters
 *
 * @example
 * ```typescript
 * const f1 = BloomFilter.create(2048, 3);
 * const f2 = BloomFilter.create(2048, 3);
 * const merged = BloomFilter.merge(f1, f2);
 * ```
 */
export function merge(filter1: import("./BloomFilterType.js").BloomFilterType, filter2: import("./BloomFilterType.js").BloomFilterType): import("./BloomFilterType.js").BloomFilterType;
//# sourceMappingURL=merge.d.ts.map