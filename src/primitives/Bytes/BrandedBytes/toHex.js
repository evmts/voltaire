/**
 * Convert Bytes to hex string
 *
 * @param {import('./BrandedBytes.js').BrandedBytes} bytes - Bytes to convert
 * @returns {import('../../Hex/index.js').BrandedHex} Hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const hex = Bytes.toHex(bytes);
 * // "0x1234"
 * ```
 */
export function toHex(bytes) {
	return /** @type {import('../../Hex/index.js').BrandedHex} */ (
		`0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`
	);
}
