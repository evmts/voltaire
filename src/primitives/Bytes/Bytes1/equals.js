/**
 * Check if two Bytes1 are equal
 *
 * @param {import('./BrandedBytes1.js').BrandedBytes1} a - First Bytes1
 * @param {import('./BrandedBytes1.js').BrandedBytes1} b - Second Bytes1
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
