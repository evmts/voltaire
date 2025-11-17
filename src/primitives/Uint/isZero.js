/**
 * Check if value is zero
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.js').BrandedUint} uint - Value to check
 * @returns {boolean} true if uint === 0
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const a = Uint256.from(0n);
 * const isZero = Uint256.isZero(a); // true
 * ```
 */
export function isZero(uint) {
	return uint === 0n;
}
