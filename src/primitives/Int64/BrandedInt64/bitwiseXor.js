/**
 * Bitwise XOR of two Int64 values
 *
 * @param {import('./BrandedInt64.js').BrandedInt64} a - First value
 * @param {import('./BrandedInt64.js').BrandedInt64} b - Second value
 * @returns {import('./BrandedInt64.js').BrandedInt64} Result
 */
export function bitwiseXor(a, b) {
	const result = a ^ b;

	return /** @type {import('./BrandedInt64.js').BrandedInt64} */ (result);
}
