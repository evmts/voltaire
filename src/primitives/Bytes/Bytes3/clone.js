/**
 * Clone Bytes3
 *
 * @param {import('./Bytes3Type.js').BytesType3} bytes - Bytes3 to clone
 * @returns {import('./Bytes3Type.js').BytesType3} Cloned Bytes3
 *
 * @example
 * ```typescript
 * const copy = Bytes3.clone(bytes);
 * ```
 */
export function clone(bytes) {
	return /** @type {import('./Bytes3Type.js').BytesType3} */ (
		new Uint8Array([bytes[0]])
	);
}
