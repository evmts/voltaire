/**
 * Check if two EncodedData instances are equal
 *
 * @param {import('./EncodedDataType.js').EncodedDataType} a - First EncodedData
 * @param {import('./EncodedDataType.js').EncodedDataType} b - Second EncodedData
 * @returns {boolean} True if equal
 *
 * @example
 * ```typescript
 * const isEqual = EncodedData.equals(data1, data2);
 * ```
 */
export function equals(a, b) {
	return a.toLowerCase() === b.toLowerCase();
}
