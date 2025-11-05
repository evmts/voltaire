/**
 * Convert Uint256 to hex string
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - Uint256 value to convert
 * @param {boolean} [padded=true] - Whether to pad to 64 characters (32 bytes)
 * @returns {string} Hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const value = Uint(255n);
 * const hex1 = Uint.toHex(value); // "0x00...ff"
 * const hex2 = value.toHex(); // "0x00...ff"
 * const hex3 = value.toHex(false); // "0xff"
 * ```
 */
export function toHex(uint, padded = true) {
	const hex = uint.toString(16);
	return padded ? `0x${hex.padStart(64, "0")}` : `0x${hex}`;
}
