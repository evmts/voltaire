/**
 * Arithmetic shift Int64 right by n bits (preserves sign)
 *
 * @param {import('./BrandedInt64.js').BrandedInt64} value - Value to shift
 * @param {bigint} n - Number of bits to shift
 * @returns {import('./BrandedInt64.js').BrandedInt64} Result
 */
export function shiftRight(value, n) {
	const result = value >> n;

	return /** @type {import('./BrandedInt64.js').BrandedInt64} */ (result);
}
