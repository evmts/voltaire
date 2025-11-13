/**
 * Convert Bytes6 to hex string
 *
 * @param {import('./BrandedBytes6.js').BrandedBytes6} bytes - Bytes6 to convert
 * @returns {import('../../Hex/index.js').BrandedHex} Hex string
 *
 * @example
 * ```typescript
 * const hex = Bytes6.toHex(bytes);
 * ```
 */
export function toHex(bytes) {
	return /** @type {import('../../Hex/index.js').BrandedHex} */ (
		`0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`
	);
}
