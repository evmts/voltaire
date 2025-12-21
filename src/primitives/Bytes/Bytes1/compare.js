/**
 * Compare two Bytes1
 *
 * @param {import('./Bytes1Type.js').Bytes1Type} a - First Bytes1
 * @param {import('./Bytes1Type.js').Bytes1Type} b - Second Bytes1
 * @returns {number} -1 if a < b, 0 if equal, 1 if a > b
 *
 * @example
 * ```typescript
 * const cmp = Bytes1.compare(bytes1, bytes2);
 * ```
 */
export function compare(a, b) {
	const aVal = /** @type {number} */ (a[0]);
	const bVal = /** @type {number} */ (b[0]);
	if (aVal < bVal) return -1;
	if (aVal > bVal) return 1;
	return 0;
}
