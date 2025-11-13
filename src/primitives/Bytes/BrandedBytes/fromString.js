/**
 * Create Bytes from UTF-8 string
 *
 * @param {string} str - UTF-8 string
 * @returns {import('./BrandedBytes.js').BrandedBytes} Bytes
 *
 * @example
 * ```typescript
 * const bytes = Bytes.fromString("hello");
 * // Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f])
 * ```
 */
export function fromString(str) {
	const encoder = new TextEncoder();
	return /** @type {import('./BrandedBytes.js').BrandedBytes} */ (
		encoder.encode(str)
	);
}
