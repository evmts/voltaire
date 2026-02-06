import { InvalidRangeError } from "../errors/index.js";
import { BITS, MODULO } from "./constants.js";
/**
 * Shift Int256 left with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/int256 for Int256 documentation
 * @since 0.0.0
 * @param {import('./Int256Type.js').BrandedInt256} value - Value to shift
 * @param {number | bigint} shift - Shift amount
 * @returns {import('./Int256Type.js').BrandedInt256} Shifted value
 * @throws {InvalidRangeError} If shift amount is negative
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(1n);
 * Int256.shiftLeft(a, 8); // 256n
 * ```
 */
export function shiftLeft(value, shift) {
    const shiftAmount = BigInt(shift);
    if (shiftAmount < 0n) {
        throw new InvalidRangeError("Shift amount must be non-negative", {
            value: shift,
            expected: "non-negative shift amount",
            docsPath: "/primitives/int256#shift-left",
        });
    }
    if (shiftAmount >= BigInt(BITS)) {
        return /** @type {import('./Int256Type.js').BrandedInt256} */ (0n);
    }
    // Convert to unsigned for shift
    const unsigned = value < 0n ? value + MODULO : value;
    const shifted = (unsigned << shiftAmount) & (MODULO - 1n);
    // Convert back to signed
    return /** @type {import("./Int256Type.js").BrandedInt256} */ (shifted >= MODULO / 2n ? shifted - MODULO : shifted);
}
