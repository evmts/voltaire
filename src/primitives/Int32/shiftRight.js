/**
 * Arithmetic shift Int32 right by n bits (preserves sign)
 *
 * @param {import('./Int32Type.js').BrandedInt32} value - Value to shift
 * @param {number} n - Number of bits to shift (0-31)
 * @returns {import('./Int32Type.js').BrandedInt32} Result
 */
export function shiftRight(value, n) {
	const result = value >> n;

	return /** @type {import('./Int32Type.js').BrandedInt32} */ (result);
}
