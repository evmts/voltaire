/**
 * Convert Bytes6 to generic Bytes
 *
 * @param {import('./Bytes6Type.js').Bytes6Type} bytes - Bytes6 to convert
 * @returns {import('../BytesType.js').BytesType} Generic Bytes
 *
 * @example
 * ```typescript
 * const genericBytes = Bytes6.toBytes(bytes);
 * ```
 */
export function toBytes(bytes) {
	return /** @type {import('../BytesType.js').BytesType} */ (
		/** @type {unknown} */ (bytes)
	);
}
