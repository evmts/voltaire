/**
 * Get size of Bytes
 *
 * @param {import('./../BytesType.js').BytesType} bytes - Bytes
 * @returns {number} Size in bytes
 *
 * @example
 * ```typescript
 * const size = Bytes.size(bytes);
 * ```
 */
export function size(bytes) {
	return bytes.length;
}
