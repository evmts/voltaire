/**
 * Bitwise XOR of two Uint8 values
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {import('./Uint8Type.js').Uint8Type} a - First operand
 * @param {import('./Uint8Type.js').Uint8Type} b - Second operand
 * @returns {import('./Uint8Type.js').Uint8Type} Bitwise XOR result
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const a = Uint8.from(0b11110000);
 * const b = Uint8.from(0b11001100);
 * const result = Uint8.bitwiseXor(a, b); // 0b00111100 = 60
 * ```
 */
export function bitwiseXor(a, b) {
	return /** @type {import('./Uint8Type.js').Uint8Type} */ (a ^ b);
}
