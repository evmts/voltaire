/**
 * Convert Bytes to UTF-8 string
 *
 * @param {import('./BytesType.js').BytesType} bytes - Bytes to convert
 * @returns {string} UTF-8 string
 *
 * @example
 * ```typescript
 * const str = Bytes.toString(bytes);
 * // "hello"
 * ```
 */
// biome-ignore lint/suspicious/noShadowRestrictedNames: intentional API name
export function toString(bytes) {
	const decoder = new TextDecoder();
	return decoder.decode(bytes);
}
