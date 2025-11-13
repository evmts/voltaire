/**
 * Get sign of Int64 value
 *
 * @param {import('./BrandedInt64.js').BrandedInt64} value - Value
 * @returns {-1 | 0 | 1} -1 if negative, 0 if zero, 1 if positive
 */
export function sign(value) {
	if (value < 0n) return -1;
	if (value > 0n) return 1;
	return 0;
}
