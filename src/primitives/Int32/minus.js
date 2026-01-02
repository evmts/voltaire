import {
	IntegerOverflowError,
	IntegerUnderflowError,
} from "../errors/index.js";

/**
 * Subtract two Int32 values
 *
 * @param {import('./Int32Type.js').BrandedInt32} a - First value
 * @param {import('./Int32Type.js').BrandedInt32} b - Second value
 * @returns {import('./Int32Type.js').BrandedInt32} Result
 * @throws {IntegerOverflowError} If result exceeds INT32_MAX
 * @throws {IntegerUnderflowError} If result is below INT32_MIN
 */
export function minus(a, b) {
	const result = (a - b) | 0;

	// Check for overflow (positive - negative = negative when overflow)
	if (a > 0 && b < 0 && result < 0) {
		throw new IntegerOverflowError(`Int32 overflow: ${a} - ${b}`, {
			value: a - b,
			max: 2147483647,
			type: "int32",
			context: { operation: "minus", operands: [a, b] },
		});
	}
	// Check for underflow (negative - positive = positive when underflow)
	if (a < 0 && b > 0 && result > 0) {
		throw new IntegerUnderflowError(`Int32 underflow: ${a} - ${b}`, {
			value: a - b,
			min: -2147483648,
			type: "int32",
			context: { operation: "minus", operands: [a, b] },
		});
	}

	return /** @type {import('./Int32Type.js').BrandedInt32} */ (result);
}
