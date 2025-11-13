/**
 * Check if Int64 value is positive
 *
 * @param {import('./BrandedInt64.js').BrandedInt64} value - Value
 * @returns {boolean} True if positive
 */
export function isPositive(value) {
	return value > 0n;
}
