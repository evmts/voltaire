/**
 * Convert Bytes7 to generic Bytes
 *
 * @param {import('./Bytes7Type.js').BytesType7} bytes - Bytes7 to convert
 * @returns {import('../BytesType.js').BytesType} Generic Bytes
 *
 * @example
 * ```typescript
 * const genericBytes = Bytes7.toBytes(bytes);
 * ```
 */
export function toBytes(bytes) {
	return /** @type {import('../BytesType.js').BytesType} */ (bytes);
}
