import { IntegerOverflowError, InvalidRangeError } from "../errors/index.js";

const INT64_MIN = -9223372036854775808n;
const INT64_MAX = 9223372036854775807n;

/**
 * Divide two Int64 values (truncates toward zero)
 *
 * @param {import('./Int64Type.js').BrandedInt64} a - Dividend
 * @param {import('./Int64Type.js').BrandedInt64} b - Divisor
 * @returns {import('./Int64Type.js').BrandedInt64} Quotient
 * @throws {InvalidRangeError} If divisor is zero
 * @throws {IntegerOverflowError} If MIN / -1 overflows
 */
export function dividedBy(a, b) {
	if (b === 0n) {
		throw new InvalidRangeError("Division by zero", {
			value: b,
			expected: "non-zero divisor",
			docsPath: "/primitives/int64#divided-by",
		});
	}

	// Special case: MIN / -1 would overflow
	if (a === INT64_MIN && b === -1n) {
		throw new IntegerOverflowError(`Int64 overflow: ${a} / ${b}`, {
			value: -INT64_MIN,
			max: INT64_MAX,
			type: "int64",
			context: { operation: "dividedBy", operands: [a, b] },
		});
	}

	const result = a / b;

	return /** @type {import('./Int64Type.js').BrandedInt64} */ (result);
}
