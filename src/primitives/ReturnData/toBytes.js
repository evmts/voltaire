/**
 * Convert ReturnData to plain Uint8Array
 *
 * @param {import('./ReturnDataType.js').ReturnDataType} data - ReturnData
 * @returns {Uint8Array} Plain byte array
 *
 * @example
 * ```typescript
 * const bytes = ReturnData.toBytes(data);
 * ```
 */
export function toBytes(data) {
	return new Uint8Array(data);
}
