import { times } from "./times.js";

/**
 * Multiply two Uint8 values with overflow checking
 *
 * Throws when the exact result does not fit in 8 bits. Every Uint size
 * exposes this function with the same semantics.
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {import('./Uint8Type.js').Uint8Type} a - First operand
 * @param {import('./Uint8Type.js').Uint8Type} b - Second operand
 * @returns {import('./Uint8Type.js').Uint8Type} Product (a * b)
 * @throws {Uint8OverflowError} If the result exceeds 2^8 - 1
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * Uint8.timesChecked(Uint8.from(5), Uint8.from(3)); // 15
 * Uint8.timesChecked(Uint8.MAX, Uint8.from(2)); // throws Uint8OverflowError
 * ```
 */
export function timesChecked(a, b) {
	return times(a, b);
}
