/**
 * Check if hex has specific byte size
 *
 * @param {string} hex - Hex string to check
 * @param {number} targetSize - Expected size in bytes
 * @returns {boolean} True if size matches
 *
 * @example
 * ```typescript
 * const hex = Hex('0x1234');
 * const is2 = Hex.isSized(hex, 2); // true
 * const is2b = hex.isSized(2); // true
 * ```
 */
export function isSized(hex, targetSize) {
	return (hex.length - 2) / 2 === targetSize;
}
