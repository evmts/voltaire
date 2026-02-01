import { MAX } from "./constants.js";
import { Uint32NegativeError, Uint32NotIntegerError, Uint32NotSafeIntegerError, Uint32OverflowError, } from "./errors.js";
/**
 * Create Uint32 from number, bigint, or string
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {number | bigint | string} value - number, bigint, or decimal/hex string
 * @returns {import('./Uint32Type.js').Uint32Type} Uint32 value
 * @throws {Uint32NotSafeIntegerError} If value is not a safe integer
 * @throws {Uint32NotIntegerError} If value is not an integer
 * @throws {Uint32NegativeError} If value is negative
 * @throws {Uint32OverflowError} If value exceeds maximum
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.from(100);
 * const b = Uint32.from("255");
 * const c = Uint32.from("0xff");
 * const d = Uint32.from(42n);
 * ```
 */
export function from(value) {
    let numberValue;
    if (typeof value === "string") {
        if (value.startsWith("0x") || value.startsWith("0X")) {
            numberValue = Number(BigInt(value));
        }
        else {
            numberValue = Number(value);
        }
    }
    else if (typeof value === "bigint") {
        numberValue = Number(value);
    }
    else {
        numberValue = value;
    }
    if (!Number.isSafeInteger(numberValue)) {
        throw new Uint32NotSafeIntegerError(`Uint32 value must be a safe integer: ${value}`, { value });
    }
    if (!Number.isInteger(numberValue)) {
        throw new Uint32NotIntegerError(`Uint32 value must be an integer: ${value}`, { value });
    }
    if (numberValue < 0) {
        throw new Uint32NegativeError(`Uint32 value cannot be negative: ${numberValue}`, { value: numberValue });
    }
    if (numberValue > MAX) {
        throw new Uint32OverflowError(`Uint32 value exceeds maximum: ${numberValue}`, { value: numberValue });
    }
    return /** @type {import('./Uint32Type.js').Uint32Type} */ (numberValue);
}
