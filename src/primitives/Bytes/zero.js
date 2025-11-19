/**
 * Create zero Bytes of specified size
 *
 * @param {number} size - Size in bytes
 * @returns {import('./BytesType.js').BytesType} Zero Bytes
 *
 * @example
 * ```typescript
 * const zeros = Bytes.zero(32);
 * ```
 */
export function zero(size) {
	return /** @type {import('./BytesType.js').BytesType} */ (
		new Uint8Array(size)
	);
}
