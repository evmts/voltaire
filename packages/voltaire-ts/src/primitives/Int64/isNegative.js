/**
 * Check if Int64 value is negative
 *
 * @param {import('./Int64Type.js').BrandedInt64} value - Value
 * @returns {boolean} True if negative
 */
export function isNegative(value) {
	return value < 0n;
}
