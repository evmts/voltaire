/**
 * Clone Bytes8
 *
 * @param {import('./Bytes8Type.js').BytesType8} bytes - Bytes8 to clone
 * @returns {import('./Bytes8Type.js').BytesType8} Cloned Bytes8
 *
 * @example
 * ```typescript
 * const copy = Bytes8.clone(bytes);
 * ```
 */
export function clone(bytes) {
	return /** @type {import('./Bytes8Type.js').BytesType8} */ (
		new Uint8Array([bytes[0]])
	);
}
