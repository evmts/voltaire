import { IntegerOverflowError, InvalidRangeError } from "../errors/index.js";

/**
 * Divide two Int32 values (truncates toward zero)
 *
 * @param {import('./Int32Type.js').BrandedInt32} a - Dividend
 * @param {import('./Int32Type.js').BrandedInt32} b - Divisor
 * @returns {import('./Int32Type.js').BrandedInt32} Quotient
 * @throws {InvalidRangeError} If divisor is zero
 * @throws {IntegerOverflowError} If MIN / -1 overflows
 */
export function dividedBy(a, b) {
	if (b === 0) {
		throw new InvalidRangeError("Division by zero", {
			value: b,
			expected: "non-zero divisor",
			docsPath: "/primitives/int32#divided-by",
		});
	}

	// Special case: MIN / -1 would overflow
	if (a === -2147483648 && b === -1) {
		throw new IntegerOverflowError(`Int32 overflow: ${a} / ${b}`, {
			value: 2147483648,
			max: 2147483647,
			type: "int32",
			context: { operation: "dividedBy", operands: [a, b] },
		});
	}

	const result = (a / b) | 0;

	return /** @type {import('./Int32Type.js').BrandedInt32} */ (result);
}
