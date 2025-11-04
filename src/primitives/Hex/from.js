import { fromBytes } from "./fromBytes.js";

/**
 * Create Hex from string or bytes
 *
 * @param {string | Uint8Array} value - Hex string or bytes
 * @returns {import('./BrandedHex.js').BrandedHex} Hex string
 *
 * @example
 * ```typescript
 * const hex = Hex.from('0x1234');
 * const hex2 = Hex.from(new Uint8Array([0x12, 0x34]));
 * ```
 */
export function from(value) {
	if (typeof value === "string") {
		return /** @type {import('./BrandedHex.js').BrandedHex} */ (value);
	}
	return fromBytes(value);
}
