/**
 * Clone Bytes3
 *
 * @param {import('./BrandedBytes3.js').BrandedBytes3} bytes - Bytes3 to clone
 * @returns {import('./BrandedBytes3.js').BrandedBytes3} Cloned Bytes3
 *
 * @example
 * ```typescript
 * const copy = Bytes3.clone(bytes);
 * ```
 */
export function clone(bytes) {
	return /** @type {import('./BrandedBytes3.js').BrandedBytes3} */ (
		new Uint8Array([bytes[0]])
	);
}
