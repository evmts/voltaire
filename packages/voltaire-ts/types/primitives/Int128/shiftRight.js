import { InvalidRangeError } from "../errors/index.js";
import { BITS } from "./constants.js";
/**
 * Arithmetic right shift of Int128 (sign-preserving)
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./Int128Type.js').BrandedInt128} value - Value to shift
 * @param {number | bigint} shift - Shift amount
 * @returns {import('./Int128Type.js').BrandedInt128} Shifted value (sign-extended)
 * @throws {InvalidRangeError} If shift amount is negative
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(-256n);
 * Int128.shiftRight(a, 1); // -128n (sign preserved)
 * ```
 */
export function shiftRight(value, shift) {
    const shiftAmount = BigInt(shift);
    if (shiftAmount < 0n) {
        throw new InvalidRangeError("Shift amount must be non-negative", {
            value: shift,
            expected: "non-negative shift amount",
            docsPath: "/primitives/int128#shift-right",
        });
    }
    if (shiftAmount >= BigInt(BITS)) {
        // Return all 1s for negative, 0 for positive
        return /** @type {import('./Int128Type.js').BrandedInt128} */ (value < 0n ? -1n : 0n);
    }
    // BigInt >> preserves sign (arithmetic shift)
    return /** @type {import('./Int128Type.js').BrandedInt128} */ (value >> shiftAmount);
}
