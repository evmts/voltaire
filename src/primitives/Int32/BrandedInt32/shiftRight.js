/**
 * Arithmetic shift Int32 right by n bits (preserves sign)
 *
 * @param {import('./BrandedInt32.js').BrandedInt32} value - Value to shift
 * @param {number} n - Number of bits to shift (0-31)
 * @returns {import('./BrandedInt32.js').BrandedInt32} Result
 */
export function shiftRight(value, n) {
	const result = value >> n;

	return /** @type {import('./BrandedInt32.js').BrandedInt32} */ (result);
}
