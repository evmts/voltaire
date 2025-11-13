/**
 * Convert Bytes7 to hex string
 *
 * @param {import('./BrandedBytes7.js').BrandedBytes7} bytes - Bytes7 to convert
 * @returns {import('../../Hex/index.js').BrandedHex} Hex string
 *
 * @example
 * ```typescript
 * const hex = Bytes7.toHex(bytes);
 * ```
 */
export function toHex(bytes) {
	return /** @type {import('../../Hex/index.js').BrandedHex} */ (
		`0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`
	);
}
