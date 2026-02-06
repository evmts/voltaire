import { IntegerOverflowError } from "../errors/index.js";
/**
 * Get absolute value of Int32
 *
 * @param {import('./Int32Type.js').BrandedInt32} value - Value
 * @returns {import('./Int32Type.js').BrandedInt32} Absolute value
 * @throws {IntegerOverflowError} If value is MIN (abs would overflow)
 */
export function abs(value) {
    if (value === -2147483648) {
        throw new IntegerOverflowError("Cannot get absolute value of Int32.MIN", {
            value: 2147483648,
            max: 2147483647,
            type: "int32",
            context: { operation: "abs" },
        });
    }
    const result = value < 0 ? -value : value;
    return /** @type {import('./Int32Type.js').BrandedInt32} */ (result);
}
