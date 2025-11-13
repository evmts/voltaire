/**
 * Clone Bytes5
 *
 * @param {import('./BrandedBytes5.js').BrandedBytes5} bytes - Bytes5 to clone
 * @returns {import('./BrandedBytes5.js').BrandedBytes5} Cloned Bytes5
 *
 * @example
 * ```typescript
 * const copy = Bytes5.clone(bytes);
 * ```
 */
export function clone(bytes) {
	return /** @type {import('./BrandedBytes5.js').BrandedBytes5} */ (
		new Uint8Array([bytes[0]])
	);
}
