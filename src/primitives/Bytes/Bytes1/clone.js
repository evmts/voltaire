/**
 * Clone Bytes1
 *
 * @param {import('./BrandedBytes1.js').BrandedBytes1} bytes - Bytes1 to clone
 * @returns {import('./BrandedBytes1.js').BrandedBytes1} Cloned Bytes1
 *
 * @example
 * ```typescript
 * const copy = Bytes1.clone(bytes);
 * ```
 */
export function clone(bytes) {
	return /** @type {import('./BrandedBytes1.js').BrandedBytes1} */ (
		new Uint8Array([bytes[0]])
	);
}
