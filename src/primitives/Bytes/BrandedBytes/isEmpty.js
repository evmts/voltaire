/**
 * Check if Bytes is empty
 *
 * @param {import('./BrandedBytes.js').BrandedBytes} bytes - Bytes to check
 * @returns {boolean} True if empty
 *
 * @example
 * ```typescript
 * const empty = Bytes.isEmpty(bytes);
 * ```
 */
export function isEmpty(bytes) {
	return bytes.length === 0;
}
