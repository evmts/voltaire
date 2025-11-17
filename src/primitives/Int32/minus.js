/**
 * Subtract two Int32 values
 *
 * @param {import('./Int32Type.js').BrandedInt32} a - First value
 * @param {import('./Int32Type.js').BrandedInt32} b - Second value
 * @returns {import('./Int32Type.js').BrandedInt32} Result
 * @throws {Error} If result overflows
 */
export function minus(a, b) {
	const result = (a - b) | 0;

	// Check for overflow
	if ((a > 0 && b < 0 && result < 0) || (a < 0 && b > 0 && result > 0)) {
		throw new Error(`Int32 overflow: ${a} - ${b}`);
	}

	return /** @type {import('./Int32Type.js').BrandedInt32} */ (result);
}
