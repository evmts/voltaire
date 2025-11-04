/**
 * Convert number to hex
 *
 * @param {number} value - Number to convert
 * @param {number} [size] - Optional byte size for padding
 * @returns {import('./BrandedHex.js').BrandedHex} Hex string
 *
 * @example
 * ```typescript
 * Hex.fromNumber(255);     // '0xff'
 * Hex.fromNumber(255, 2);  // '0x00ff'
 * Hex.fromNumber(0x1234);  // '0x1234'
 * ```
 */
export function fromNumber(value, size) {
	let hex = value.toString(16);
	if (size !== undefined) {
		hex = hex.padStart(size * 2, "0");
	}
	return /** @type {import('./BrandedHex.js').BrandedHex} */ (`0x${hex}`);
}
