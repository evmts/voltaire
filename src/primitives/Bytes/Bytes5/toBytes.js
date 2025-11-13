/**
 * Convert Bytes5 to generic Bytes
 *
 * @param {import('./BrandedBytes5.js').BrandedBytes5} bytes - Bytes5 to convert
 * @returns {import('../BrandedBytes/BrandedBytes.js').BrandedBytes} Generic Bytes
 *
 * @example
 * ```typescript
 * const genericBytes = Bytes5.toBytes(bytes);
 * ```
 */
export function toBytes(bytes) {
	return /** @type {import('../BrandedBytes/BrandedBytes.js').BrandedBytes} */ (
		bytes
	);
}
