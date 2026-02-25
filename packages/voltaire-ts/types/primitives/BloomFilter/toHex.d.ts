/**
 * Convert bloom filter to hex string
 *
 * @param {import('./BloomFilterType.js').BloomFilterType} filter - Bloom filter
 * @returns {import('../Hex/HexType.js').HexType} Hex string representation
 *
 * @example
 * ```typescript
 * const filter = BloomFilter.create(2048, 3);
 * const hex = BloomFilter.toHex(filter);
 * ```
 */
export function toHex(filter: import("./BloomFilterType.js").BloomFilterType): import("../Hex/HexType.js").HexType;
//# sourceMappingURL=toHex.d.ts.map