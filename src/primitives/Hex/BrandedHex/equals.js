/**
 * Check if two hex strings are equal
 *
 * @param {string} hex - First hex string
 * @param {string} other - Hex string to compare with
 * @returns {boolean} True if equal
 *
 * @example
 * ```typescript
 * const hex = Hex('0x1234');
 * const eq1 = Hex.equals(hex, '0x1234'); // true
 * const eq2 = hex.equals('0x1234'); // true
 * ```
 */
export function equals(hex, other) {
	return hex.toLowerCase() === other.toLowerCase();
}
