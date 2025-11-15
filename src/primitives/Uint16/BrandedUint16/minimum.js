/**
 * Return minimum of two Uint16 values
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./Uint16Type.js').Uint16Type} a - First operand
 * @param {import('./Uint16Type.js').Uint16Type} b - Second operand
 * @returns {import('./Uint16Type.js').Uint16Type} Minimum value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.from(30000);
 * const b = Uint16.from(10000);
 * const min = Uint16.minimum(a, b); // 10000
 * ```
 */
export function minimum(a, b) {
	return /** @type {import('./Uint16Type.js').Uint16Type} */ (
		a < b ? a : b
	);
}
