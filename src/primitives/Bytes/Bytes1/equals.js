/**
 * Check if two Bytes1 are equal
 *
 * @param {import('./Bytes1Type.js').Bytes1Type} a - First Bytes1
 * @param {import('./Bytes1Type.js').Bytes1Type} b - Second Bytes1
 * @returns {boolean} True if equal
 *
 * @example
 * ```typescript
 * const equal = Bytes1.equals(bytes1, bytes2);
 * ```
 */
export function equals(a, b) {
	return a[0] === b[0];
}
