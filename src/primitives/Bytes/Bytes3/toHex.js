/**
 * Convert Bytes3 to hex string
 *
 * @param {import('./BrandedBytes3.js').BrandedBytes3} bytes - Bytes3 to convert
 * @returns {import('../../Hex/index.js').BrandedHex} Hex string
 *
 * @example
 * ```typescript
 * const hex = Bytes3.toHex(bytes);
 * ```
 */
export function toHex(bytes) {
	return /** @type {import('../../Hex/index.js').BrandedHex} */ (
		`0x${bytes[0].toString(16).padStart(2, "0")}`
	);
}
