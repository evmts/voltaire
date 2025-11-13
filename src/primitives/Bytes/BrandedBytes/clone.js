/**
 * Clone Bytes
 *
 * @param {import('./BrandedBytes.js').BrandedBytes} bytes - Bytes to clone
 * @returns {import('./BrandedBytes.js').BrandedBytes} Cloned Bytes
 *
 * @example
 * ```typescript
 * const copy = Bytes.clone(bytes);
 * ```
 */
export function clone(bytes) {
	return /** @type {import('./BrandedBytes.js').BrandedBytes} */ (
		new Uint8Array(bytes)
	);
}
