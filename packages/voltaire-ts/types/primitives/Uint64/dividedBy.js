import { Uint64DivisionByZeroError } from "./errors.js";
/**
 * Divide Uint64 value (integer division)
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./Uint64Type.js').Uint64Type} uint - Dividend
 * @param {import('./Uint64Type.js').Uint64Type} b - Divisor
 * @returns {import('./Uint64Type.js').Uint64Type} Quotient (uint / b) truncated
 * @throws {Uint64DivisionByZeroError} If divisor is zero
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.from(100n);
 * const b = Uint64.from(3n);
 * const quotient = Uint64.dividedBy(a, b); // 33n
 * ```
 */
export function dividedBy(uint, b) {
    if (b === 0n) {
        throw new Uint64DivisionByZeroError("Division by zero", { dividend: uint });
    }
    return /** @type {import('./Uint64Type.js').Uint64Type} */ (uint / b);
}
