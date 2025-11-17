/**
 * Create a copy of a Uint256 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.js').BrandedUint} uint - Uint256 value to clone
 * @returns {import('./BrandedUint.js').BrandedUint} Copy of the value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const n1 = Uint256.from(100n);
 * const n2 = Uint256.clone(n1);
 * console.log(Uint256.equals(n1, n2)); // true
 * ```
 */
export function clone(uint) {
	return uint;
}
