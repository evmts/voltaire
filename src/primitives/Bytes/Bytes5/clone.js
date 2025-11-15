/**
 * Clone Bytes5
 *
 * @param {import('./Bytes5Type.js').BytesType5} bytes - Bytes5 to clone
 * @returns {import('./Bytes5Type.js').BytesType5} Cloned Bytes5
 *
 * @example
 * ```typescript
 * const copy = Bytes5.clone(bytes);
 * ```
 */
export function clone(bytes) {
	return /** @type {import('./Bytes5Type.js').BytesType5} */ (
		new Uint8Array([bytes[0]])
	);
}
