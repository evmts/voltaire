/**
 * Convert Uint256 to bigint
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.js').BrandedUint} uint - Uint256 value to convert
 * @returns {bigint} bigint value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const value = Uint256.from(255n);
 * const bigint = Uint256.toBigInt(value);
 * ```
 */
export function toBigInt(uint) {
	return uint;
}
