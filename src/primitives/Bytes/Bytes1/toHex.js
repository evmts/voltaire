/**
 * Convert Bytes1 to hex string
 *
 * @param {import('./BrandedBytes1.js').BrandedBytes1} bytes - Bytes1 to convert
 * @returns {import('../../Hex/index.js').BrandedHex} Hex string
 *
 * @example
 * ```typescript
 * const hex = Bytes1.toHex(bytes);
 * ```
 */
export function toHex(bytes) {
	return /** @type {import('../../Hex/index.js').BrandedHex} */ (
		`0x${bytes[0].toString(16).padStart(2, "0")}`
	);
}
