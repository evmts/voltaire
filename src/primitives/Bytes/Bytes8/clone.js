/**
 * Clone Bytes8
 *
 * @param {import('./Bytes8Type.js').Bytes8Type} bytes - Bytes8 to clone
 * @returns {import('./Bytes8Type.js').Bytes8Type} Cloned Bytes8
 *
 * @example
 * ```typescript
 * const copy = Bytes8.clone(bytes);
 * ```
 */
export function clone(bytes) {
	return /** @type {import('./Bytes8Type.js').Bytes8Type} */ (
		new Uint8Array(bytes)
	);
}
