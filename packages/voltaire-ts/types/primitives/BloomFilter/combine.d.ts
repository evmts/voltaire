/**
 * Combine multiple bloom filters using bitwise OR
 * All filters must have same size and hash count
 *
 * @param {...import('./BloomFilterType.js').BloomFilterType} filters - Bloom filters to combine
 * @returns {import('./BloomFilterType.js').BloomFilterType} Combined bloom filter
 * @throws {InvalidBloomFilterParameterError} If filters have different parameters
 *
 * @example
 * ```typescript
 * const f1 = BloomFilter.create(2048, 3);
 * const f2 = BloomFilter.create(2048, 3);
 * const f3 = BloomFilter.create(2048, 3);
 * const combined = BloomFilter.combine(f1, f2, f3);
 * ```
 */
export function combine(...filters: import("./BloomFilterType.js").BloomFilterType[]): import("./BloomFilterType.js").BloomFilterType;
//# sourceMappingURL=combine.d.ts.map