/**
 * Convert Bytes1 to generic Bytes
 *
 * @param {import('./Bytes1Type.js').Bytes1Type} bytes - Bytes1 to convert
 * @returns {import('../BytesType.js').BytesType} Generic Bytes
 *
 * @example
 * ```typescript
 * const genericBytes = Bytes1.toBytes(bytes);
 * ```
 */
export function toBytes(bytes) {
	return /** @type {import('../BytesType.js').BytesType} */ (
		/** @type {unknown} */ (bytes)
	);
}
