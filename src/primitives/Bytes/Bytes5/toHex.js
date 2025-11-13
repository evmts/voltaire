/**
 * Convert Bytes5 to hex string
 *
 * @param {import('./BrandedBytes5.js').BrandedBytes5} bytes - Bytes5 to convert
 * @returns {import('../../Hex/index.js').BrandedHex} Hex string
 *
 * @example
 * ```typescript
 * const hex = Bytes5.toHex(bytes);
 * ```
 */
export function toHex(bytes) {
	return /** @type {import('../../Hex/index.js').BrandedHex} */ (
		`0x${bytes[0].toString(16).padStart(2, "0")}`
	);
}
