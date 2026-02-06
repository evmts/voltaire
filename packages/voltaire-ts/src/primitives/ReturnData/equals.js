/**
 * Check if two ReturnData instances are equal
 *
 * @param {import('./ReturnDataType.js').ReturnDataType} a - First ReturnData
 * @param {import('./ReturnDataType.js').ReturnDataType} b - Second ReturnData
 * @returns {boolean} True if equal
 *
 * @example
 * ```typescript
 * const isEqual = ReturnData.equals(data1, data2);
 * ```
 */
export function equals(a, b) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}
