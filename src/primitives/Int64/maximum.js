/**
 * Get maximum of two Int64 values
 *
 * @param {import('./Int64Type.js').BrandedInt64} a - First value
 * @param {import('./Int64Type.js').BrandedInt64} b - Second value
 * @returns {import('./Int64Type.js').BrandedInt64} Maximum value
 */
export function maximum(a, b) {
	return /** @type {import('./Int64Type.js').BrandedInt64} */ (a > b ? a : b);
}
