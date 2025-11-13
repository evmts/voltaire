/**
 * Clone Bytes2
 *
 * @param {import('./BrandedBytes2.js').BrandedBytes2} bytes - Bytes2 to clone
 * @returns {import('./BrandedBytes2.js').BrandedBytes2} Cloned Bytes2
 *
 * @example
 * ```typescript
 * const copy = Bytes2.clone(bytes);
 * ```
 */
export function clone(bytes) {
	return /** @type {import('./BrandedBytes2.js').BrandedBytes2} */ (
		new Uint8Array([bytes[0]])
	);
}
