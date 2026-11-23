import { encodeHexDigits } from "../Hex/encodeHexDigits.js";

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
export function toHex(filter) {
	return /** @type {import('../Hex/HexType.js').HexType} */ (
		`0x${encodeHexDigits(filter)}`
	);
}
