/**
 * Clone Bytes5
 *
 * @param {import('./Bytes5Type.js').Bytes5Type} bytes - Bytes5 to clone
 * @returns {import('./Bytes5Type.js').Bytes5Type} Cloned Bytes5
 *
 * @example
 * ```typescript
 * const copy = Bytes5.clone(bytes);
 * ```
 */
export function clone(bytes) {
	return /** @type {import('./Bytes5Type.js').Bytes5Type} */ (
		new Uint8Array(bytes)
	);
}
