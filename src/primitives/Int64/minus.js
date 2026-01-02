import {
	IntegerOverflowError,
	IntegerUnderflowError,
} from "../errors/index.js";

const INT64_MIN = -9223372036854775808n;
const INT64_MAX = 9223372036854775807n;

/**
 * Subtract two Int64 values
 *
 * @param {import('./Int64Type.js').BrandedInt64} a - First value
 * @param {import('./Int64Type.js').BrandedInt64} b - Second value
 * @returns {import('./Int64Type.js').BrandedInt64} Result
 * @throws {IntegerOverflowError} If result exceeds INT64_MAX
 * @throws {IntegerUnderflowError} If result is below INT64_MIN
 */
export function minus(a, b) {
	const result = a - b;

	if (result > INT64_MAX) {
		throw new IntegerOverflowError(`Int64 overflow: ${a} - ${b}`, {
			value: result,
			max: INT64_MAX,
			type: "int64",
			context: { operation: "minus", operands: [a, b] },
		});
	}
	if (result < INT64_MIN) {
		throw new IntegerUnderflowError(`Int64 underflow: ${a} - ${b}`, {
			value: result,
			min: INT64_MIN,
			type: "int64",
			context: { operation: "minus", operands: [a, b] },
		});
	}

	return /** @type {import('./Int64Type.js').BrandedInt64} */ (result);
}
