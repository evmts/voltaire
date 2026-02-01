/**
 * Get maximum of two values
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.js').BrandedUint} uint - First value
 * @param {import('./BrandedUint.js').BrandedUint} b - Second value
 * @returns {import('./BrandedUint.js').BrandedUint} max(uint, b)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const a = Uint256.from(100n);
 * const b = Uint256.from(200n);
 * const max = Uint256.maximum(a, b); // 200n
 * ```
 */
export function maximum(uint, b) {
	return uint > b ? uint : b;
}
