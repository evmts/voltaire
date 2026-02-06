import { IntegerOverflowError } from "../errors/index.js";
const INT64_MIN = -9223372036854775808n;
const INT64_MAX = 9223372036854775807n;
/**
 * Get absolute value of Int64
 *
 * @param {import('./Int64Type.js').BrandedInt64} value - Value
 * @returns {import('./Int64Type.js').BrandedInt64} Absolute value
 * @throws {IntegerOverflowError} If value is MIN (abs would overflow)
 */
export function abs(value) {
    if (value === INT64_MIN) {
        throw new IntegerOverflowError("Cannot get absolute value of Int64.MIN", {
            value: -INT64_MIN,
            max: INT64_MAX,
            type: "int64",
            context: { operation: "abs" },
        });
    }
    const result = value < 0n ? -value : value;
    return /** @type {import('./Int64Type.js').BrandedInt64} */ (result);
}
