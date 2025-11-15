/**
 * Convert Bytes2 to generic Bytes
 *
 * @param {import('./Bytes2Type.js').BytesType2} bytes - Bytes2 to convert
 * @returns {import('../BytesType.js').BytesType} Generic Bytes
 *
 * @example
 * ```typescript
 * const genericBytes = Bytes2.toBytes(bytes);
 * ```
 */
export function toBytes(bytes) {
	return /** @type {import('../BytesType.js').BytesType} */ (bytes);
}
