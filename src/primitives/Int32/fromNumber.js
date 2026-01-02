import {
	IntegerOverflowError,
	IntegerUnderflowError,
	InvalidFormatError,
} from "../errors/index.js";

const INT32_MIN = -2147483648;
const INT32_MAX = 2147483647;

/**
 * Create Int32 from number
 *
 * @param {number} value - Number to convert
 * @returns {import('./Int32Type.js').BrandedInt32} Int32 value
 * @throws {InvalidFormatError} If value is NaN
 * @throws {IntegerOverflowError} If value exceeds INT32_MAX
 * @throws {IntegerUnderflowError} If value is below INT32_MIN
 */
export function fromNumber(value) {
	if (Number.isNaN(value)) {
		throw new InvalidFormatError("Cannot create Int32 from NaN", {
			value,
			expected: "valid number",
			docsPath: "/primitives/int32#from-number",
		});
	}

	// Truncate to 32-bit signed integer
	const num = value | 0;

	if (num > INT32_MAX) {
		throw new IntegerOverflowError(`Int32 value exceeds maximum: ${num}`, {
			value: num,
			max: INT32_MAX,
			type: "int32",
		});
	}
	if (num < INT32_MIN) {
		throw new IntegerUnderflowError(`Int32 value is below minimum: ${num}`, {
			value: num,
			min: INT32_MIN,
			type: "int32",
		});
	}

	return /** @type {import('./Int32Type.js').BrandedInt32} */ (num);
}
