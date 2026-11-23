import { MAX } from "./constants.js";

/**
 * Multiply two Uint8 values with wrapping
 *
 * Returns the exact result modulo 2^8 and never throws. Every Uint size
 * exposes this function with the same semantics.
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {import('./Uint8Type.js').Uint8Type} a - First operand
 * @param {import('./Uint8Type.js').Uint8Type} b - Second operand
 * @returns {import('./Uint8Type.js').Uint8Type} Product (a * b) mod 2^8
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * Uint8.timesWrapping(Uint8.MAX, Uint8.from(2)); // Uint8.MAX - 1
 * ```
 */
export function timesWrapping(a, b) {
	return /** @type {import('./Uint8Type.js').Uint8Type} */ ((a * b) & MAX);
}
