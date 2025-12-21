/**
 * Multiply Uint32 value with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./Uint32Type.js').Uint32Type} uint - First operand
 * @param {import('./Uint32Type.js').Uint32Type} b - Second operand
 * @returns {import('./Uint32Type.js').Uint32Type} Product (uint * b) mod 2^32
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.from(100);
 * const b = Uint32.from(50);
 * const product = Uint32.times(a, b); // 5000
 * ```
 */
export function times(uint, b) {
	return /** @type {import('./Uint32Type.js').Uint32Type} */ (Math.imul(uint, b) >>> 0);
}
