/**
 * Convert Bytes8 to generic Bytes
 *
 * @param {import('./Bytes8Type.js').BytesType8} bytes - Bytes8 to convert
 * @returns {import('../BytesType.js').BytesType} Generic Bytes
 *
 * @example
 * ```typescript
 * const genericBytes = Bytes8.toBytes(bytes);
 * ```
 */
export function toBytes(bytes) {
	return /** @type {import('../BytesType.js').BytesType} */ (bytes);
}
