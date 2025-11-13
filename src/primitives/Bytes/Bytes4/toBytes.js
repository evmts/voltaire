/**
 * Convert Bytes4 to generic Bytes
 *
 * @param {import('./BrandedBytes4.js').BrandedBytes4} bytes - Bytes4 to convert
 * @returns {import('../BrandedBytes/BrandedBytes.js').BrandedBytes} Generic Bytes
 *
 * @example
 * ```typescript
 * const genericBytes = Bytes4.toBytes(bytes);
 * ```
 */
export function toBytes(bytes) {
	return /** @type {import('../BrandedBytes/BrandedBytes.js').BrandedBytes} */ (
		bytes
	);
}
