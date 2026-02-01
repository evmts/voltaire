import { IntegerOverflowError } from "../errors/index.js";
/**
 * Negate Int32 value
 *
 * @param {import('./Int32Type.js').BrandedInt32} value - Value
 * @returns {import('./Int32Type.js').BrandedInt32} Negated value
 * @throws {IntegerOverflowError} If value is MIN (negation would overflow)
 */
export function negate(value) {
    if (value === -2147483648) {
        throw new IntegerOverflowError("Cannot negate Int32.MIN", {
            value: 2147483648,
            max: 2147483647,
            type: "int32",
            context: { operation: "negate" },
        });
    }
    const result = -value;
    return /** @type {import('./Int32Type.js').BrandedInt32} */ (result);
}
