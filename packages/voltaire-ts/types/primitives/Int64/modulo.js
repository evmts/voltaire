import { InvalidRangeError } from "../errors/index.js";
/**
 * Compute modulo of two Int64 values
 *
 * @param {import('./Int64Type.js').BrandedInt64} a - Dividend
 * @param {import('./Int64Type.js').BrandedInt64} b - Divisor
 * @returns {import('./Int64Type.js').BrandedInt64} Remainder
 * @throws {InvalidRangeError} If divisor is zero
 */
export function modulo(a, b) {
    if (b === 0n) {
        throw new InvalidRangeError("Modulo by zero", {
            value: b,
            expected: "non-zero divisor",
            docsPath: "/primitives/int64#modulo",
        });
    }
    const result = a % b;
    return /** @type {import('./Int64Type.js').BrandedInt64} */ (result);
}
