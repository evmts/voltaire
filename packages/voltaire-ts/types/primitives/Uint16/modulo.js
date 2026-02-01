import { Uint16DivisionByZeroError } from "./errors.js";
/**
 * Compute modulo of two Uint16 values
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./Uint16Type.js').Uint16Type} a - Dividend
 * @param {import('./Uint16Type.js').Uint16Type} b - Divisor
 * @returns {import('./Uint16Type.js').Uint16Type} Remainder (a % b)
 * @throws {Uint16DivisionByZeroError} If divisor is zero
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.from(10007);
 * const b = Uint16.from(1000);
 * const remainder = Uint16.modulo(a, b); // 7
 * ```
 */
export function modulo(a, b) {
    if (b === 0) {
        throw new Uint16DivisionByZeroError("Modulo by zero", { dividend: a });
    }
    return /** @type {import('./Uint16Type.js').Uint16Type} */ (a % b);
}
