import * as OxHex from "ox/Hex";

/**
 * Convert boolean to hex
 *
 * @param {boolean} value - Boolean to convert
 * @returns {import('./BrandedHex.js').Sized<1>} Hex string ('0x01' for true, '0x00' for false)
 *
 * @example
 * ```typescript
 * Hex.fromBoolean(true);  // '0x01'
 * Hex.fromBoolean(false); // '0x00'
 * ```
 */
export function fromBoolean(value) {
	return /** @type {import('./BrandedHex.js').Sized<1>} */ (
		OxHex.padLeft(OxHex.fromBoolean(value), 1)
	);
}
