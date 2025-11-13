/**
 * Convert Uint128 to decimal string
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint128.js').BrandedUint128} uint - Uint128 value
 * @returns {string} Decimal string representation
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const value = Uint128.from(255n);
 * const str = Uint128.toString(value); // "255"
 * ```
 */
export function toString(uint) {
	return uint.toString();
}
