/**
 * Clone Bytes6
 *
 * @param {import('./BrandedBytes6.js').BrandedBytes6} bytes - Bytes6 to clone
 * @returns {import('./BrandedBytes6.js').BrandedBytes6} Cloned Bytes6
 *
 * @example
 * ```typescript
 * const copy = Bytes6.clone(bytes);
 * ```
 */
export function clone(bytes) {
	return /** @type {import('./BrandedBytes6.js').BrandedBytes6} */ (
		new Uint8Array([bytes[0]])
	);
}
