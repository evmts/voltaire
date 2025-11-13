/**
 * Check if Int64 value is negative
 *
 * @param {import('./BrandedInt64.js').BrandedInt64} value - Value
 * @returns {boolean} True if negative
 */
export function isNegative(value) {
	return value < 0n;
}
