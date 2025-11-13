/**
 * Clone Bytes7
 *
 * @param {import('./BrandedBytes7.js').BrandedBytes7} bytes - Bytes7 to clone
 * @returns {import('./BrandedBytes7.js').BrandedBytes7} Cloned Bytes7
 *
 * @example
 * ```typescript
 * const copy = Bytes7.clone(bytes);
 * ```
 */
export function clone(bytes) {
	return /** @type {import('./BrandedBytes7.js').BrandedBytes7} */ (
		new Uint8Array([bytes[0]])
	);
}
