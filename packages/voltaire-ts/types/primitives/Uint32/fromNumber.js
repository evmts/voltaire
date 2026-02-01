import { MAX } from "./constants.js";
import { Uint32NegativeError, Uint32NotIntegerError, Uint32NotSafeIntegerError, Uint32OverflowError, } from "./errors.js";
/**
 * Create Uint32 from number
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {number} value - number value
 * @returns {import('./Uint32Type.js').Uint32Type} Uint32 value
 * @throws {Uint32NotSafeIntegerError} If value is not a safe integer
 * @throws {Uint32NotIntegerError} If value is not an integer
 * @throws {Uint32NegativeError} If value is negative
 * @throws {Uint32OverflowError} If value exceeds maximum
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const value = Uint32.fromNumber(42);
 * ```
 */
export function fromNumber(value) {
    if (!Number.isSafeInteger(value)) {
        throw new Uint32NotSafeIntegerError(`Uint32 value must be a safe integer: ${value}`, { value });
    }
    if (!Number.isInteger(value)) {
        throw new Uint32NotIntegerError(`Uint32 value must be an integer: ${value}`, { value });
    }
    if (value < 0) {
        throw new Uint32NegativeError(`Uint32 value cannot be negative: ${value}`, {
            value,
        });
    }
    if (value > MAX) {
        throw new Uint32OverflowError(`Uint32 value exceeds maximum: ${value}`, {
            value,
        });
    }
    return /** @type {import('./Uint32Type.js').Uint32Type} */ (value);
}
