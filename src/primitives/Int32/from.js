import {
	IntegerOverflowError,
	IntegerUnderflowError,
	InvalidFormatError,
} from "../errors/index.js";

const INT32_MIN = -2147483648;
const INT32_MAX = 2147483647;

/**
 * Create Int32 from various input types
 *
 * @param {number | bigint | string} value - Value to convert
 * @returns {import('./Int32Type.js').BrandedInt32} Int32 value
 * @throws {InvalidFormatError} If value cannot be converted
 * @throws {IntegerOverflowError} If value exceeds INT32_MAX
 * @throws {IntegerUnderflowError} If value is below INT32_MIN
 * @example
 * ```javascript
 * import * as Int32 from './primitives/Int32/index.js';
 * const a = Int32.from(-42);
 * const b = Int32.from("123");
 * const c = Int32.from(-2147483648n);
 * ```
 */
export function from(value) {
	let num;

	if (typeof value === "number") {
		// Check bounds BEFORE truncation to detect overflow
		if (value > INT32_MAX) {
			throw new IntegerOverflowError(`Int32 value exceeds maximum: ${value}`, {
				value,
				max: INT32_MAX,
				type: "int32",
			});
		}
		if (value < INT32_MIN) {
			throw new IntegerUnderflowError(`Int32 value is below minimum: ${value}`, {
				value,
				min: INT32_MIN,
				type: "int32",
			});
		}
		num = value;
	} else if (typeof value === "bigint") {
		if (value > BigInt(INT32_MAX)) {
			throw new IntegerOverflowError(`Int32 value exceeds maximum: ${value}`, {
				value,
				max: INT32_MAX,
				type: "int32",
			});
		}
		if (value < BigInt(INT32_MIN)) {
			throw new IntegerUnderflowError(
				`Int32 value is below minimum: ${value}`,
				{
					value,
					min: INT32_MIN,
					type: "int32",
				},
			);
		}
		num = Number(value);
	} else if (typeof value === "string") {
		const parsed = Number(value);
		if (Number.isNaN(parsed)) {
			throw new InvalidFormatError(`Cannot convert string to Int32: ${value}`, {
				value,
				expected: "valid numeric string",
				docsPath: "/primitives/int32#from",
			});
		}
		// Check bounds BEFORE truncation to detect overflow
		if (parsed > INT32_MAX) {
			throw new IntegerOverflowError(`Int32 value exceeds maximum: ${parsed}`, {
				value: parsed,
				max: INT32_MAX,
				type: "int32",
			});
		}
		if (parsed < INT32_MIN) {
			throw new IntegerUnderflowError(`Int32 value is below minimum: ${parsed}`, {
				value: parsed,
				min: INT32_MIN,
				type: "int32",
			});
		}
		num = parsed;
	} else {
		throw new InvalidFormatError(`Cannot convert ${typeof value} to Int32`, {
			value,
			expected: "number, bigint, or string",
			docsPath: "/primitives/int32#from",
		});
	}

	// Truncate to 32-bit signed integer (bounds already checked above)
	num = num | 0;

	return /** @type {import('./Int32Type.js').BrandedInt32} */ (num);
}
