/**
 * Divide two Int32 values (truncates toward zero)
 *
 * @param {import('./BrandedInt32.js').BrandedInt32} a - Dividend
 * @param {import('./BrandedInt32.js').BrandedInt32} b - Divisor
 * @returns {import('./BrandedInt32.js').BrandedInt32} Quotient
 * @throws {Error} If divisor is zero or overflow occurs
 */
export function dividedBy(a, b) {
	if (b === 0) {
		throw new Error("Division by zero");
	}

	// Special case: MIN / -1 would overflow
	if (a === -2147483648 && b === -1) {
		throw new Error(`Int32 overflow: ${a} / ${b}`);
	}

	const result = (a / b) | 0;

	return /** @type {import('./BrandedInt32.js').BrandedInt32} */ (result);
}
