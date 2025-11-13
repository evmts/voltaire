/**
 * Convert Bytes2 to hex string
 *
 * @param {import('./BrandedBytes2.js').BrandedBytes2} bytes - Bytes2 to convert
 * @returns {import('../../Hex/index.js').BrandedHex} Hex string
 *
 * @example
 * ```typescript
 * const hex = Bytes2.toHex(bytes);
 * ```
 */
export function toHex(bytes) {
	return /** @type {import('../../Hex/index.js').BrandedHex} */ (
		`0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`
	);
}
