import { Uint16UnderflowError } from "./errors.js";
/**
 * Subtract two Uint16 values with underflow checking
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./Uint16Type.js').Uint16Type} a - First operand
 * @param {import('./Uint16Type.js').Uint16Type} b - Second operand
 * @returns {import('./Uint16Type.js').Uint16Type} Difference (a - b)
 * @throws {Uint16UnderflowError} If result is negative
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.from(30000);
 * const b = Uint16.from(20000);
 * const diff = Uint16.minus(a, b); // 10000
 * ```
 */
export function minus(a, b) {
    if (a < b) {
        throw new Uint16UnderflowError(`Uint16 underflow: ${a} - ${b} = ${a - b} is negative`, { a, b });
    }
    return /** @type {import('./Uint16Type.js').Uint16Type} */ (a - b);
}
