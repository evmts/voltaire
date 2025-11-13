/**
 * Get sign of Int32 value
 *
 * @param {import('./BrandedInt32.js').BrandedInt32} value - Value
 * @returns {-1 | 0 | 1} -1 if negative, 0 if zero, 1 if positive
 */
export function sign(value) {
	if (value < 0) return -1;
	if (value > 0) return 1;
	return 0;
}
