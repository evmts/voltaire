/**
 * Check greater than or equal
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.js').BrandedUint} uint - First value
 * @param {import('./BrandedUint.js').BrandedUint} b - Second value
 * @returns {boolean} true if uint >= b
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const a = Uint256.from(200n);
 * const b = Uint256.from(200n);
 * const isGreaterOrEqual = Uint256.greaterThanOrEqual(a, b); // true
 * ```
 */
export function greaterThanOrEqual(uint, b) {
	return uint >= b;
}
