/**
 * Convert Bytes1 to number
 *
 * @param {import('./BrandedBytes1.js').BrandedBytes1} bytes - Bytes1 to convert
 * @returns {number} Number value
 *
 * @example
 * ```typescript
 * const num = Bytes1.toNumber(bytes);
 * ```
 */
export function toNumber(bytes) {
	return bytes[0];
}
