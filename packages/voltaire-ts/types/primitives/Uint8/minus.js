import { Uint8UnderflowError } from "./errors.js";
/**
 * Subtract two Uint8 values with underflow checking
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {import('./Uint8Type.js').Uint8Type} a - First operand
 * @param {import('./Uint8Type.js').Uint8Type} b - Second operand
 * @returns {import('./Uint8Type.js').Uint8Type} Difference (a - b)
 * @throws {Uint8UnderflowError} If result is negative
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const a = Uint8.from(100);
 * const b = Uint8.from(50);
 * const diff = Uint8.minus(a, b); // 50
 * ```
 */
export function minus(a, b) {
    if (a < b) {
        throw new Uint8UnderflowError(`Uint8 underflow: ${a} - ${b} = ${a - b} is negative`, { a, b });
    }
    return /** @type {import('./Uint8Type.js').Uint8Type} */ (a - b);
}
