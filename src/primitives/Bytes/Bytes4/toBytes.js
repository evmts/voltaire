/**
 * Convert Bytes4 to generic Bytes
 *
 * @param {import('./Bytes4Type.js').Bytes4Type} bytes - Bytes4 to convert
 * @returns {import('../BytesType.js').BytesType} Generic Bytes
 *
 * @example
 * ```typescript
 * const genericBytes = Bytes4.toBytes(bytes);
 * ```
 */
export function toBytes(bytes) {
	return /** @type {import('../BytesType.js').BytesType} */ (
		/** @type {unknown} */ (bytes)
	);
}
