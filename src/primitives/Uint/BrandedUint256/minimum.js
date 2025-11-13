/**
 * Get minimum of two values
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.js').BrandedUint} uint - First value
 * @param {import('./BrandedUint.js').BrandedUint} b - Second value
 * @returns {import('./BrandedUint.js').BrandedUint} min(uint, b)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const a = Uint256.from(100n);
 * const b = Uint256.from(200n);
 * const min = Uint256.minimum(a, b); // 100n
 * ```
 */
export function minimum(uint, b) {
	return uint < b ? uint : b;
}
