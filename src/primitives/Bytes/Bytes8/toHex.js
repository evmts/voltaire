/**
 * Convert Bytes8 to hex string
 *
 * @param {import('./BrandedBytes8.js').BrandedBytes8} bytes - Bytes8 to convert
 * @returns {import('../../Hex/index.js').BrandedHex} Hex string
 *
 * @example
 * ```typescript
 * const hex = Bytes8.toHex(bytes);
 * ```
 */
export function toHex(bytes) {
	return /** @type {import('../../Hex/index.js').BrandedHex} */ (
		`0x${bytes[0].toString(16).padStart(2, "0")}`
	);
}
