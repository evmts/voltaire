/**
 * Clone Bytes4
 *
 * @param {import('./BrandedBytes4.js').BrandedBytes4} bytes - Bytes4 to clone
 * @returns {import('./BrandedBytes4.js').BrandedBytes4} Cloned Bytes4
 *
 * @example
 * ```typescript
 * const copy = Bytes4.clone(bytes);
 * ```
 */
export function clone(bytes) {
	return /** @type {import('./BrandedBytes4.js').BrandedBytes4} */ (
		new Uint8Array([bytes[0]])
	);
}
