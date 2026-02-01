import { MAX } from "./constants.js";
import { Uint8NegativeError, Uint8OverflowError } from "./errors.js";
/**
 * Create Uint8 from bigint
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {bigint} value - bigint value
 * @returns {import('./Uint8Type.js').Uint8Type} Uint8 value
 * @throws {Uint8NegativeError} If value is negative
 * @throws {Uint8OverflowError} If value exceeds maximum (255)
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const value = Uint8.fromBigint(255n);
 * ```
 */
export function fromBigint(value) {
    if (value < 0n) {
        throw new Uint8NegativeError(`Uint8 value cannot be negative: ${value}`, {
            value,
        });
    }
    if (value > BigInt(MAX)) {
        throw new Uint8OverflowError(`Uint8 value exceeds maximum (255): ${value}`, { value });
    }
    return /** @type {import('./Uint8Type.js').Uint8Type} */ (Number(value));
}
