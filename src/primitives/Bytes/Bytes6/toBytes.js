/**
 * Convert Bytes6 to generic Bytes
 *
 * @param {import('./BrandedBytes6.js').BrandedBytes6} bytes - Bytes6 to convert
 * @returns {import('../BrandedBytes/BrandedBytes.js').BrandedBytes} Generic Bytes
 *
 * @example
 * ```typescript
 * const genericBytes = Bytes6.toBytes(bytes);
 * ```
 */
export function toBytes(bytes) {
	return /** @type {import('../BrandedBytes/BrandedBytes.js').BrandedBytes} */ (
		bytes
	);
}
