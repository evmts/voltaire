/**
 * Convert Uint256 to string representation
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.js').BrandedUint} uint - Uint256 value to convert
 * @param {number} [radix=10] - Base for string conversion (2, 10, 16, etc.)
 * @returns {string} String representation
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const value = Uint256.from(255n);
 * const dec = Uint256.toString(value, 10); // "255"
 * const hex = Uint256.toString(value, 16); // "ff"
 * ```
 */
export function toString(uint, radix = 10) {
	return uint.toString(radix);
}
