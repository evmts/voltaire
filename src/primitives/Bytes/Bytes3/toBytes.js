/**
 * Convert Bytes3 to generic Bytes
 *
 * @param {import('./BrandedBytes3.js').BrandedBytes3} bytes - Bytes3 to convert
 * @returns {import('../BrandedBytes/BrandedBytes.js').BrandedBytes} Generic Bytes
 *
 * @example
 * ```typescript
 * const genericBytes = Bytes3.toBytes(bytes);
 * ```
 */
export function toBytes(bytes) {
	return /** @type {import('../BrandedBytes/BrandedBytes.js').BrandedBytes} */ (
		bytes
	);
}
