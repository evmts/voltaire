/**
 * Create zero Bytes of specified size
 *
 * @param {number} size - Size in bytes
 * @returns {import('./BrandedBytes.js').BrandedBytes} Zero Bytes
 *
 * @example
 * ```typescript
 * const zeros = Bytes.zero(32);
 * ```
 */
export function zero(size) {
	return /** @type {import('./BrandedBytes.js').BrandedBytes} */ (
		new Uint8Array(size)
	);
}
