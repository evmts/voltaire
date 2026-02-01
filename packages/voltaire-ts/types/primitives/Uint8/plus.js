import { MAX } from "./constants.js";
import { Uint8OverflowError } from "./errors.js";
/**
 * Add two Uint8 values with overflow checking
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {import('./Uint8Type.js').Uint8Type} a - First operand
 * @param {import('./Uint8Type.js').Uint8Type} b - Second operand
 * @returns {import('./Uint8Type.js').Uint8Type} Sum (a + b)
 * @throws {Uint8OverflowError} If result exceeds maximum value (255)
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const a = Uint8.from(100);
 * const b = Uint8.from(50);
 * const sum = Uint8.plus(a, b); // 150
 * ```
 */
export function plus(a, b) {
    const sum = a + b;
    if (sum > MAX) {
        throw new Uint8OverflowError(`Uint8 overflow: ${a} + ${b} = ${sum} exceeds maximum (255)`, { value: sum, context: { a, b, operation: "addition" } });
    }
    return /** @type {import('./Uint8Type.js').Uint8Type} */ (sum);
}
