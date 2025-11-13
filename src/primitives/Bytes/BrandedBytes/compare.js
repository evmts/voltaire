/**
 * Compare two Bytes (lexicographic)
 *
 * @param {import('./BrandedBytes.js').BrandedBytes} a - First Bytes
 * @param {import('./BrandedBytes.js').BrandedBytes} b - Second Bytes
 * @returns {number} -1 if a < b, 0 if equal, 1 if a > b
 *
 * @example
 * ```typescript
 * const cmp = Bytes.compare(bytes1, bytes2);
 * ```
 */
export function compare(a, b) {
	const minLen = Math.min(a.length, b.length);
	for (let i = 0; i < minLen; i++) {
		if (a[i] < b[i]) return -1;
		if (a[i] > b[i]) return 1;
	}
	if (a.length < b.length) return -1;
	if (a.length > b.length) return 1;
	return 0;
}
