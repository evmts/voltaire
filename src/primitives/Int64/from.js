import {
	IntegerOverflowError,
	IntegerUnderflowError,
	InvalidFormatError,
} from "../errors/index.js";

const INT64_MIN = -9223372036854775808n;
const INT64_MAX = 9223372036854775807n;

/**
 * Create Int64 from various input types
 *
 * @param {bigint | number | string} value - Value to convert
 * @returns {import('./Int64Type.js').BrandedInt64} Int64 value
 * @throws {InvalidFormatError} If value cannot be converted
 * @throws {IntegerOverflowError} If value exceeds INT64_MAX
 * @throws {IntegerUnderflowError} If value is below INT64_MIN
 * @example
 * ```javascript
 * import * as Int64 from './primitives/Int64/index.js';
 * const a = Int64.from(-42n);
 * const b = Int64.from("123");
 * const c = Int64.from(42);
 * ```
 */
export function from(value) {
	let bigintVal;

	if (typeof value === "bigint") {
		bigintVal = value;
	} else if (typeof value === "number") {
		if (Number.isNaN(value)) {
			throw new InvalidFormatError("Cannot convert NaN to Int64", {
				value,
				expected: "valid number",
				docsPath: "/primitives/int64#from",
			});
		}
		if (!Number.isFinite(value)) {
			throw new InvalidFormatError("Cannot convert Infinity to Int64", {
				value,
				expected: "finite number",
				docsPath: "/primitives/int64#from",
			});
		}
		bigintVal = BigInt(Math.trunc(value));
	} else if (typeof value === "string") {
		try {
			bigintVal = BigInt(value);
		} catch {
			throw new InvalidFormatError(`Cannot convert string to Int64: ${value}`, {
				value,
				expected: "valid numeric string",
				docsPath: "/primitives/int64#from",
			});
		}
	} else {
		throw new InvalidFormatError(`Cannot convert ${typeof value} to Int64`, {
			value,
			expected: "bigint, number, or string",
			docsPath: "/primitives/int64#from",
		});
	}

	if (bigintVal > INT64_MAX) {
		throw new IntegerOverflowError(`Int64 value exceeds maximum: ${bigintVal}`, {
			value: bigintVal,
			max: INT64_MAX,
			type: "int64",
		});
	}
	if (bigintVal < INT64_MIN) {
		throw new IntegerUnderflowError(`Int64 value is below minimum: ${bigintVal}`, {
			value: bigintVal,
			min: INT64_MIN,
			type: "int64",
		});
	}

	return /** @type {import('./Int64Type.js').BrandedInt64} */ (bigintVal);
}
