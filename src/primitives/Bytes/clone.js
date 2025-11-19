/**
 * Clone Bytes
 *
 * @param {import('./BytesType.js').BytesType} bytes - Bytes to clone
 * @returns {import('./BytesType.js').BytesType} Cloned Bytes
 *
 * @example
 * ```typescript
 * const copy = Bytes.clone(bytes);
 * ```
 */
export function clone(bytes) {
	return /** @type {import('./BytesType.js').BytesType} */ (
		new Uint8Array(bytes)
	);
}
