/**
 * Convert Bytes to UTF-8 string
 *
 * @param {import('./BrandedBytes.js').BrandedBytes} bytes - Bytes to convert
 * @returns {string} UTF-8 string
 *
 * @example
 * ```typescript
 * const str = Bytes.toString(bytes);
 * // "hello"
 * ```
 */
export function toString(bytes) {
	const decoder = new TextDecoder();
	return decoder.decode(bytes);
}
