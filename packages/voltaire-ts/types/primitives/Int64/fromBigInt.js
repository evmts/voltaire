import { IntegerOverflowError, IntegerUnderflowError, } from "../errors/index.js";
const INT64_MIN = -9223372036854775808n;
const INT64_MAX = 9223372036854775807n;
/**
 * Create Int64 from bigint
 *
 * @param {bigint} value - BigInt to convert
 * @returns {import('./Int64Type.js').BrandedInt64} Int64 value
 * @throws {IntegerOverflowError} If value exceeds INT64_MAX
 * @throws {IntegerUnderflowError} If value is below INT64_MIN
 */
export function fromBigInt(value) {
    if (value > INT64_MAX) {
        throw new IntegerOverflowError(`Int64 value exceeds maximum: ${value}`, {
            value,
            max: INT64_MAX,
            type: "int64",
        });
    }
    if (value < INT64_MIN) {
        throw new IntegerUnderflowError(`Int64 value is below minimum: ${value}`, {
            value,
            min: INT64_MIN,
            type: "int64",
        });
    }
    return /** @type {import('./Int64Type.js').BrandedInt64} */ (value);
}
