import {
	IntegerOverflowError,
	IntegerUnderflowError,
} from "../errors/index.js";

/**
 * Multiply two Int32 values
 *
 * @param {import('./Int32Type.js').BrandedInt32} a - First value
 * @param {import('./Int32Type.js').BrandedInt32} b - Second value
 * @returns {import('./Int32Type.js').BrandedInt32} Result
 * @throws {IntegerOverflowError} If result exceeds INT32_MAX
 * @throws {IntegerUnderflowError} If result is below INT32_MIN
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
		const fullResult = BigInt(a) * BigInt(b);
		if (fullResult > 2147483647n) {
			throw new IntegerOverflowError(`Int32 overflow: ${a} * ${b}`, {
				value: fullResult,
				max: 2147483647,
				type: "int32",
				context: { operation: "times", operands: [a, b] },
			});
		}
		if (fullResult < -2147483648n) {
			throw new IntegerUnderflowError(`Int32 underflow: ${a} * ${b}`, {
				value: fullResult,
				min: -2147483648,
				type: "int32",
				context: { operation: "times", operands: [a, b] },
			});
		}
	}

	return /** @type {import('./Int32Type.js').BrandedInt32} */ (result);
}
