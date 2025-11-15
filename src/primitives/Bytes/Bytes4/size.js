/**
 * Get size of Bytes4 (always 4)
 *
 * @param {import('./Bytes4Type.js').BytesType4} _bytes - Bytes4
 * @returns {4} Size (always 4)
 *
 * @example
 * ```typescript
 * const size = Bytes4.size(bytes); // 4
 * ```
 */
export function size(_bytes) {
	return 4;
}
