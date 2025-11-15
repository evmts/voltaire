/**
 * Clone Bytes7
 *
 * @param {import('./Bytes7Type.js').BytesType7} bytes - Bytes7 to clone
 * @returns {import('./Bytes7Type.js').BytesType7} Cloned Bytes7
 *
 * @example
 * ```typescript
 * const copy = Bytes7.clone(bytes);
 * ```
 */
export function clone(bytes) {
	return /** @type {import('./Bytes7Type.js').BytesType7} */ (
		new Uint8Array([bytes[0]])
	);
}
