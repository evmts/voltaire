/**
 * Subtract two Int64 values
 *
 * @param {import('./BrandedInt64.js').BrandedInt64} a - First value
 * @param {import('./BrandedInt64.js').BrandedInt64} b - Second value
 * @returns {import('./BrandedInt64.js').BrandedInt64} Result
 * @throws {Error} If result overflows
 */
export function minus(a, b) {
	const result = a - b;

	// Check for overflow
	if (result < -9223372036854775808n || result > 9223372036854775807n) {
		throw new Error(`Int64 overflow: ${a} - ${b}`);
	}

	return /** @type {import('./BrandedInt64.js').BrandedInt64} */ (result);
}
