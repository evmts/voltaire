/**
 * Convert Uint128 to hex string
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint128.js').BrandedUint128} uint - Uint128 value
 * @returns {string} Hex string with 0x prefix
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const value = Uint128.from(255n);
 * const hex = Uint128.toHex(value); // "0xff"
 * ```
 */
export function toHex(uint) {
	return `0x${uint.toString(16)}`;
}
