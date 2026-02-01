/**
 * Clone Bytes6
 *
 * @param {import('./Bytes6Type.js').Bytes6Type} bytes - Bytes6 to clone
 * @returns {import('./Bytes6Type.js').Bytes6Type} Cloned Bytes6
 *
 * @example
 * ```typescript
 * const copy = Bytes6.clone(bytes);
 * ```
 */
export function clone(bytes) {
	return /** @type {import('./Bytes6Type.js').Bytes6Type} */ (
		new Uint8Array(bytes)
	);
}
