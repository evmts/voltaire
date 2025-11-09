import * as OxHex from "ox/Hex";

/**
 * Convert hex to boolean
 *
 * @param {import('./BrandedHex.js').BrandedHex} hex - Hex string to convert
 * @returns {boolean} Boolean value (true if non-zero, false if zero)
 *
 * @example
 * ```typescript
 * const hex = Hex('0x01');
 * const bool1 = Hex.toBoolean(hex); // true
 * const bool2 = hex.toBoolean(); // true
 * ```
 */
export function toBoolean(hex) {
	const bytes = OxHex.toBytes(hex);
	return bytes.some((b) => b !== 0);
}
