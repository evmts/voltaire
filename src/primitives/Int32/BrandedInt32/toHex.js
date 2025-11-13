/**
 * Convert Int32 to hex string (two's complement)
 *
 * @param {import('./BrandedInt32.js').BrandedInt32} value - Int32 value
 * @returns {string} Hex string with 0x prefix
 */
export function toHex(value) {
	// Convert to unsigned 32-bit
	const unsigned = value >>> 0;

	return "0x" + unsigned.toString(16).padStart(8, "0");
}
