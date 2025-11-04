/**
 * Convert Uint256 to string representation
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - Uint256 value to convert
 * @param {number} [radix=10] - Base for string conversion (2, 10, 16, etc.)
 * @returns {string} String representation
 *
 * @example
 * ```typescript
 * const value = Uint(255n);
 * const dec1 = Uint.toString(value, 10); // "255"
 * const dec2 = value.toString(10); // "255"
 * const hex = value.toString(16); // "ff"
 * ```
 */
export function toString(uint, radix = 10) {
	return uint.toString(radix);
}
