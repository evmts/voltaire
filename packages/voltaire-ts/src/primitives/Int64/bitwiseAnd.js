/**
 * Bitwise AND of two Int64 values
 *
 * @param {import('./Int64Type.js').BrandedInt64} a - First value
 * @param {import('./Int64Type.js').BrandedInt64} b - Second value
 * @returns {import('./Int64Type.js').BrandedInt64} Result
 */
export function bitwiseAnd(a, b) {
	const result = a & b;

	return /** @type {import('./Int64Type.js').BrandedInt64} */ (result);
}
