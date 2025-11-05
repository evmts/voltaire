/**
 * Convert hex to number
 *
 * @param {import('./BrandedHex.js').BrandedHex} hex - Hex string to convert
 * @returns {number} Number value
 * @throws {RangeError} If hex represents value larger than MAX_SAFE_INTEGER
 *
 * @example
 * ```typescript
 * const hex = Hex('0xff');
 * const num1 = Hex.toNumber(hex); // 255
 * const num2 = hex.toNumber(); // 255
 * ```
 */
export function toNumber(hex) {
	const num = Number.parseInt(hex.slice(2), 16);
	if (!Number.isSafeInteger(num)) {
		throw new RangeError("Hex value exceeds MAX_SAFE_INTEGER");
	}
	return num;
}
