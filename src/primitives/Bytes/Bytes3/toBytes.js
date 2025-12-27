/**
 * Convert Bytes3 to generic Bytes
 *
 * @param {import('./Bytes3Type.js').Bytes3Type} bytes - Bytes3 to convert
 * @returns {import('../BytesType.js').BytesType} Generic Bytes
 *
 * @example
 * ```typescript
 * const genericBytes = Bytes3.toBytes(bytes);
 * ```
 */
export function toBytes(bytes) {
	return /** @type {import('../BytesType.js').BytesType} */ (
		/** @type {unknown} */ (bytes)
	);
}
