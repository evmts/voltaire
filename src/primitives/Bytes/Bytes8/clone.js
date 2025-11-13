/**
 * Clone Bytes8
 *
 * @param {import('./BrandedBytes8.js').BrandedBytes8} bytes - Bytes8 to clone
 * @returns {import('./BrandedBytes8.js').BrandedBytes8} Cloned Bytes8
 *
 * @example
 * ```typescript
 * const copy = Bytes8.clone(bytes);
 * ```
 */
export function clone(bytes) {
	return /** @type {import('./BrandedBytes8.js').BrandedBytes8} */ (
		new Uint8Array([bytes[0]])
	);
}
