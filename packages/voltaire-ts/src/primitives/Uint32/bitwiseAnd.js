/**
 * Bitwise AND Uint32 values
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./Uint32Type.js').Uint32Type} uint - First operand
 * @param {import('./Uint32Type.js').Uint32Type} b - Second operand
 * @returns {import('./Uint32Type.js').Uint32Type} Result (uint & b)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.from(0b1100);
 * const b = Uint32.from(0b1010);
 * const result = Uint32.bitwiseAnd(a, b); // 0b1000 = 8
 * ```
 */
export function bitwiseAnd(uint, b) {
	return /** @type {import('./Uint32Type.js').Uint32Type} */ ((uint & b) >>> 0);
}
