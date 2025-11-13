/**
 * Convert Int64 to hex string (two's complement)
 *
 * @param {import('./BrandedInt64.js').BrandedInt64} value - Int64 value
 * @returns {string} Hex string with 0x prefix
 */
export function toHex(value) {
	// Convert to unsigned 64-bit
	const unsigned = value < 0n ? (1n << 64n) + value : value;

	return `0x${unsigned.toString(16).padStart(16, "0")}`;
}
