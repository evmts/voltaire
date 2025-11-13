/**
 * Compare two Bytes1
 *
 * @param {import('./BrandedBytes1.js').BrandedBytes1} a - First Bytes1
 * @param {import('./BrandedBytes1.js').BrandedBytes1} b - Second Bytes1
 * @returns {number} -1 if a < b, 0 if equal, 1 if a > b
 *
 * @example
 * ```typescript
 * const cmp = Bytes1.compare(bytes1, bytes2);
 * ```
 */
export function compare(a, b) {
	if (a[0] < b[0]) return -1;
	if (a[0] > b[0]) return 1;
	return 0;
}
