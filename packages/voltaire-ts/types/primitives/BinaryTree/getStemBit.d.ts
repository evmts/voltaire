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
export function getStemBit(stem: Uint8Array, pos: number): 0 | 1;
//# sourceMappingURL=getStemBit.d.ts.map