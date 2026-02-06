import { MAX } from "./constants.js";
import { Uint16InvalidHexError, Uint16NegativeError, Uint16NotIntegerError, Uint16OverflowError, } from "./errors.js";
/**
 * Create Uint16 from number or string
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {number | string} value - number or decimal/hex string
 * @returns {import('./Uint16Type.js').Uint16Type} Uint16 value
 * @throws {Uint16InvalidHexError} If string is invalid
 * @throws {Uint16NotIntegerError} If value is not an integer
 * @throws {Uint16NegativeError} If value is negative
 * @throws {Uint16OverflowError} If value exceeds maximum (65535)
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.from(1000);
 * const b = Uint16.from("65535");
 * const c = Uint16.from("0xffff");
 * ```
 */
export function from(value) {
    let numValue;
    if (typeof value === "string") {
        if (value.startsWith("0x") || value.startsWith("0X")) {
            numValue = Number.parseInt(value, 16);
        }
        else {
            numValue = Number.parseInt(value, 10);
        }
        if (Number.isNaN(numValue)) {
            throw new Uint16InvalidHexError(`Invalid Uint16 string: ${value}`, {
                value,
            });
        }
    }
    else {
        numValue = value;
    }
    if (!Number.isInteger(numValue)) {
        throw new Uint16NotIntegerError(`Uint16 value must be an integer: ${numValue}`, { value: numValue });
    }
    if (numValue < 0) {
        throw new Uint16NegativeError(`Uint16 value cannot be negative: ${numValue}`, { value: numValue });
    }
    if (numValue > MAX) {
        throw new Uint16OverflowError(`Uint16 value exceeds maximum (65535): ${numValue}`, { value: numValue });
    }
    return /** @type {import('./Uint16Type.js').Uint16Type} */ (numValue);
}
