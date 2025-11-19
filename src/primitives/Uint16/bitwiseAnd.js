/**
 * Bitwise AND of two Uint16 values
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./Uint16Type.js').Uint16Type} a - First operand
 * @param {import('./Uint16Type.js').Uint16Type} b - Second operand
 * @returns {import('./Uint16Type.js').Uint16Type} Bitwise AND result
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.from(0b1111111100000000);
 * const b = Uint16.from(0b1111000011110000);
 * const result = Uint16.bitwiseAnd(a, b); // 0b1111000000000000 = 61440
 * ```
 */
export function bitwiseAnd(a, b) {
	return /** @type {import('./Uint16Type.js').Uint16Type} */ (a & b);
}
