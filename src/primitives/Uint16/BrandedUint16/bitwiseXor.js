/**
 * Bitwise XOR of two Uint16 values
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint16.js').BrandedUint16} a - First operand
 * @param {import('./BrandedUint16.js').BrandedUint16} b - Second operand
 * @returns {import('./BrandedUint16.js').BrandedUint16} Bitwise XOR result
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.from(0b1111111100000000);
 * const b = Uint16.from(0b1111000011110000);
 * const result = Uint16.bitwiseXor(a, b); // 0b0000111111110000 = 4080
 * ```
 */
export function bitwiseXor(a, b) {
	return /** @type {import('./BrandedUint16.js').BrandedUint16} */ (a ^ b);
}
