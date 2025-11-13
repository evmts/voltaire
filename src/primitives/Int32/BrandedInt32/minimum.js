/**
 * Get minimum of two Int32 values
 *
 * @param {import('./BrandedInt32.js').BrandedInt32} a - First value
 * @param {import('./BrandedInt32.js').BrandedInt32} b - Second value
 * @returns {import('./BrandedInt32.js').BrandedInt32} Minimum value
 */
export function minimum(a, b) {
	return /** @type {import('./BrandedInt32.js').BrandedInt32} */ (
		a < b ? a : b
	);
}
