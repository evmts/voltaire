/**
 * Check if value is zero
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint128.js').BrandedUint128} uint - Value to check
 * @returns {boolean} True if zero
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(0n);
 * Uint128.isZero(a); // true
 * ```
 */
export function isZero(uint) {
	return uint === 0n;
}
