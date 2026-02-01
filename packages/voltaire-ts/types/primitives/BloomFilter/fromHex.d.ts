/**
 * Create bloom filter from hex string
 *
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @param {number} m - Number of bits
 * @param {number} k - Number of hash functions
 * @returns {import('./BloomFilterType.js').BloomFilterType} BloomFilter
 * @throws {InvalidBloomFilterLengthError} If hex length doesn't match expected size
 *
 * @example
 * ```typescript
 * const filter = BloomFilter.fromHex("0x00...", 2048, 3);
 * ```
 */
export function fromHex(hex: string, m: number, k: number): import("./BloomFilterType.js").BloomFilterType;
//# sourceMappingURL=fromHex.d.ts.map