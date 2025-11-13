/**
 * Slice Bytes
 *
 * @param {import('./BrandedBytes.js').BrandedBytes} bytes - Bytes to slice
 * @param {number} start - Start index
 * @param {number} [end] - End index (optional)
 * @returns {import('./BrandedBytes.js').BrandedBytes} Sliced Bytes
 *
 * @example
 * ```typescript
 * const slice = Bytes.slice(bytes, 0, 4);
 * ```
 */
export function slice(bytes, start, end) {
	return /** @type {import('./BrandedBytes.js').BrandedBytes} */ (
		bytes.slice(start, end)
	);
}
