/**
 * Divide two Int64 values (truncates toward zero)
 *
 * @param {import('./BrandedInt64.js').BrandedInt64} a - Dividend
 * @param {import('./BrandedInt64.js').BrandedInt64} b - Divisor
 * @returns {import('./BrandedInt64.js').BrandedInt64} Quotient
 * @throws {Error} If divisor is zero or overflow occurs
 */
export function dividedBy(a, b) {
	if (b === 0n) {
		throw new Error("Division by zero");
	}

	// Special case: MIN / -1 would overflow
	if (a === -9223372036854775808n && b === -1n) {
		throw new Error(`Int64 overflow: ${a} / ${b}`);
	}

	const result = a / b;

	return /** @type {import('./BrandedInt64.js').BrandedInt64} */ (result);
}
