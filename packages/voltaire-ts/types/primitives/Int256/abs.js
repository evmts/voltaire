import { IntegerOverflowError } from "../errors/index.js";
import { MAX, MIN } from "./constants.js";
/**
 * Absolute value of Int256
 *
 * @see https://voltaire.tevm.sh/primitives/int256 for Int256 documentation
 * @since 0.0.0
 * @param {import('./Int256Type.js').BrandedInt256} value - Input value
 * @returns {import('./Int256Type.js').BrandedInt256} Absolute value
 * @throws {IntegerOverflowError} If value is MIN (abs(MIN) overflows)
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(-42n);
 * Int256.abs(a); // 42n
 * ```
 */
export function abs(value) {
    if (value === MIN) {
        throw new IntegerOverflowError("Int256 overflow: abs(MIN)", {
            value: -MIN,
            max: MAX,
            type: "int256",
            context: { operation: "abs" },
        });
    }
    return /** @type {import('./Int256Type.js').BrandedInt256} */ (value < 0n ? -value : value);
}
