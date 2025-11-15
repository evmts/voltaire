/**
 * Clone Bytes1
 *
 * @param {import('./Bytes1Type.js').Bytes1Type} bytes - Bytes1 to clone
 * @returns {import('./Bytes1Type.js').Bytes1Type} Cloned Bytes1
 *
 * @example
 * ```typescript
 * const copy = Bytes1.clone(bytes);
 * ```
 */
export function clone(bytes) {
	return /** @type {import('./Bytes1Type.js').Bytes1Type} */ (
		new Uint8Array([bytes[0]])
	);
}
