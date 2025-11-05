/**
 * Get bit at position in stem (31 bytes = 248 bits)
 *
 * @param {Uint8Array} stem - 31-byte stem
 * @param {number} pos - Bit position (0-247)
 * @returns {0 | 1} Bit value at position
 *
 * @example
 * ```typescript
 * const stem = new Uint8Array(31);
 * stem[0] = 0b10101010;
 * console.log(BinaryTree.getStemBit(stem, 0)); // 1
 * console.log(BinaryTree.getStemBit(stem, 1)); // 0
 * ```
 */
export function getStemBit(stem, pos) {
	if (pos >= 248) return 0;
	const byteIdx = Math.floor(pos / 8);
	const bitIdx = 7 - (pos % 8);
	const byte = stem[byteIdx];
	if (byte === undefined) return 0;
	return (byte >> bitIdx) & 1;
}
