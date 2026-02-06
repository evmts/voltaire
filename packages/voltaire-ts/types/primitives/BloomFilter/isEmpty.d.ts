/**
 * Check if bloom filter is empty (all bits are 0)
 *
 * @param {import('./BloomFilterType.js').BloomFilterType} filter - Bloom filter
 * @returns {boolean} True if filter is empty
 *
 * @example
 * ```typescript
 * const filter = BloomFilter.create(2048, 3);
 * console.log(BloomFilter.isEmpty(filter)); // true
 * ```
 */
export function isEmpty(filter: import("./BloomFilterType.js").BloomFilterType): boolean;
//# sourceMappingURL=isEmpty.d.ts.map