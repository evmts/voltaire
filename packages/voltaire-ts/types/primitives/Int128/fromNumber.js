import { IntegerOverflowError, IntegerUnderflowError, InvalidFormatError, } from "../errors/index.js";
import { MAX, MIN } from "./constants.js";
/**
 * Create Int128 from number
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {number} value - Integer number
 * @returns {import('./Int128Type.js').BrandedInt128} Int128 value
 * @throws {InvalidFormatError} If value is not an integer
 * @throws {IntegerOverflowError} If value exceeds maximum
 * @throws {IntegerUnderflowError} If value is below minimum
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.fromNumber(-42);
 * const b = Int128.fromNumber(100);
 * ```
 */
export function fromNumber(value) {
    if (!Number.isInteger(value)) {
        throw new InvalidFormatError(`Int128 value must be an integer: ${value}`, {
            value,
            expected: "integer",
            docsPath: "/primitives/int128#from-number",
        });
    }
    const bigintValue = BigInt(value);
    if (bigintValue > MAX) {
        throw new IntegerOverflowError(`Int128 value exceeds maximum (${MAX}): ${bigintValue}`, {
            value: bigintValue,
            max: MAX,
            type: "int128",
        });
    }
    if (bigintValue < MIN) {
        throw new IntegerUnderflowError(`Int128 value below minimum (${MIN}): ${bigintValue}`, {
            value: bigintValue,
            min: MIN,
            type: "int128",
        });
    }
    return /** @type {import('./Int128Type.js').BrandedInt128} */ (bigintValue);
}
