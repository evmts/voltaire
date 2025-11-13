/**
 * Multiply two Int32 values
 *
 * @param {import('./BrandedInt32.js').BrandedInt32} a - First value
 * @param {import('./BrandedInt32.js').BrandedInt32} b - Second value
 * @returns {import('./BrandedInt32.js').BrandedInt32} Result
 * @throws {Error} If result overflows
 */
export function times(a, b) {
	const result = Math.imul(a, b);

	// Math.imul handles overflow correctly for 32-bit signed multiplication
	// But we still need to check if the mathematical result would overflow
	if (
		a !== 0 &&
		b !== 0 &&
		((result / a) | 0) !== b &&
		!(a === -1 && b === -2147483648) &&
		!(b === -1 && a === -2147483648)
	) {
		throw new Error(`Int32 overflow: ${a} * ${b}`);
	}

	return /** @type {import('./BrandedInt32.js').BrandedInt32} */ (result);
}
