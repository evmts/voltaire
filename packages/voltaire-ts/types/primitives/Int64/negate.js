import { IntegerOverflowError } from "../errors/index.js";
const INT64_MIN = -9223372036854775808n;
const INT64_MAX = 9223372036854775807n;
/**
 * Negate Int64 value
 *
 * @param {import('./Int64Type.js').BrandedInt64} value - Value
 * @returns {import('./Int64Type.js').BrandedInt64} Negated value
 * @throws {IntegerOverflowError} If value is MIN (negation would overflow)
 */
export function negate(value) {
    if (value === INT64_MIN) {
        throw new IntegerOverflowError("Cannot negate Int64.MIN", {
            value: -INT64_MIN,
            max: INT64_MAX,
            type: "int64",
            context: { operation: "negate" },
        });
    }
    const result = -value;
    return /** @type {import('./Int64Type.js').BrandedInt64} */ (result);
}
