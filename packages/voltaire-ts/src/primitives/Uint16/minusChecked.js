import { minus } from "./minus.js";

/**
 * Subtract two Uint16 values with underflow checking
 *
 * Throws when the exact result does not fit in 16 bits. Every Uint size
 * exposes this function with the same semantics.
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./Uint16Type.js').Uint16Type} a - First operand
 * @param {import('./Uint16Type.js').Uint16Type} b - Second operand
 * @returns {import('./Uint16Type.js').Uint16Type} Difference (a - b)
 * @throws {Uint16UnderflowError} If the result is negative
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * Uint16.minusChecked(Uint16.from(5), Uint16.from(3)); // 2
 * Uint16.minusChecked(Uint16.from(0), Uint16.from(1)); // throws Uint16UnderflowError
 * ```
 */
export function minusChecked(a, b) {
	return minus(a, b);
}
