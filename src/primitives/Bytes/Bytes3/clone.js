/**
 * Clone Bytes3
 *
 * @param {import('./Bytes3Type.js').Bytes3Type} bytes - Bytes3 to clone
 * @returns {import('./Bytes3Type.js').Bytes3Type} Cloned Bytes3
 *
 * @example
 * ```typescript
 * const copy = Bytes3.clone(bytes);
 * ```
 */
export function clone(bytes) {
	return /** @type {import('./Bytes3Type.js').Bytes3Type} */ (
		new Uint8Array(bytes)
	);
}
