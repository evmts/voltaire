/**
 * Clone Bytes4
 *
 * @param {import('./Bytes4Type.js').BytesType4} bytes - Bytes4 to clone
 * @returns {import('./Bytes4Type.js').BytesType4} Cloned Bytes4
 *
 * @example
 * ```typescript
 * const copy = Bytes4.clone(bytes);
 * ```
 */
export function clone(bytes) {
	return /** @type {import('./Bytes4Type.js').BytesType4} */ (
		new Uint8Array([bytes[0]])
	);
}
