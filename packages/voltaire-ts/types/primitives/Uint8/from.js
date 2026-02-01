import { IntegerOverflowError, IntegerUnderflowError, InvalidFormatError, } from "../errors/index.js";
import { MAX } from "./constants.js";
/**
 * Create Uint8 from number or string
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {number | string} value - number or decimal/hex string
 * @returns {import('./Uint8Type.js').Uint8Type} Uint8 value
 * @throws {InvalidFormatError} If value is not a valid integer
 * @throws {IntegerUnderflowError} If value is negative
 * @throws {IntegerOverflowError} If value exceeds 255
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const a = Uint8.from(100);
 * const b = Uint8.from("255");
 * const c = Uint8.from("0xff");
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
            throw new InvalidFormatError(`Invalid Uint8 string: ${value}`, {
                code: -32602,
                value,
                expected: "decimal or 0x-prefixed hex string",
                docsPath: "/primitives/uint8#error-handling",
            });
        }
    }
    else {
        numValue = value;
    }
    if (!Number.isInteger(numValue)) {
        throw new InvalidFormatError(`Uint8 value must be an integer: ${numValue}`, {
            code: -32602,
            value: numValue,
            expected: "integer value",
            docsPath: "/primitives/uint8#error-handling",
        });
    }
    if (numValue < 0) {
        throw new IntegerUnderflowError(`Uint8 cannot be negative: ${numValue}`, {
            value: numValue,
            min: 0,
            type: "uint8",
            docsPath: "/primitives/uint8#error-handling",
        });
    }
    if (numValue > MAX) {
        throw new IntegerOverflowError(`Uint8 exceeds maximum (255): ${numValue}`, {
            value: numValue,
            max: MAX,
            type: "uint8",
            docsPath: "/primitives/uint8#error-handling",
        });
    }
    return /** @type {import('./Uint8Type.js').Uint8Type} */ (numValue);
}
