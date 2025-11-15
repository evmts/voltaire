/**
 * Get size of Bytes8 (always 8)
 *
 * @param {import('./Bytes8Type.js').BytesType8} _bytes - Bytes8
 * @returns {8} Size (always 8)
 *
 * @example
 * ```typescript
 * const size = Bytes8.size(bytes); // 8
 * ```
 */
export function size(_bytes) {
	return 8;
}
