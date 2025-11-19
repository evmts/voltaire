/**
 * Check if ReturnData is empty
 *
 * @param {import('./ReturnDataType.js').ReturnDataType} data - ReturnData
 * @returns {boolean} True if empty
 *
 * @example
 * ```typescript
 * const empty = ReturnData.isEmpty(data);
 * ```
 */
export function isEmpty(data) {
	return data.length === 0;
}
