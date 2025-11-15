/**
 * Clone Bytes2
 *
 * @param {import('./Bytes2Type.js').BytesType2} bytes - Bytes2 to clone
 * @returns {import('./Bytes2Type.js').BytesType2} Cloned Bytes2
 *
 * @example
 * ```typescript
 * const copy = Bytes2.clone(bytes);
 * ```
 */
export function clone(bytes) {
	return /** @type {import('./Bytes2Type.js').BytesType2} */ (
		new Uint8Array([bytes[0]])
	);
}
