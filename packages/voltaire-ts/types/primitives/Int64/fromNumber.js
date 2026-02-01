import { IntegerOverflowError, IntegerUnderflowError, InvalidFormatError, } from "../errors/index.js";
const INT64_MIN = -9223372036854775808n;
const INT64_MAX = 9223372036854775807n;
/**
 * Create Int64 from number
 *
 * @param {number} value - Number to convert
 * @returns {import('./Int64Type.js').BrandedInt64} Int64 value
 * @throws {InvalidFormatError} If value is NaN or Infinity
 * @throws {IntegerOverflowError} If value exceeds INT64_MAX
 * @throws {IntegerUnderflowError} If value is below INT64_MIN
 */
export function fromNumber(value) {
    if (Number.isNaN(value)) {
        throw new InvalidFormatError("Cannot create Int64 from NaN", {
            value,
            expected: "valid number",
            docsPath: "/primitives/int64#from-number",
        });
    }
    if (!Number.isFinite(value)) {
        throw new InvalidFormatError("Cannot create Int64 from Infinity", {
            value,
            expected: "finite number",
            docsPath: "/primitives/int64#from-number",
        });
    }
    const bigintVal = BigInt(Math.trunc(value));
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
