import { plus } from "./plus.js";

/**
 * Add two Uint128 values with wrapping
 *
 * Returns the exact result modulo 2^128 and never throws. Every Uint size
 * exposes this function with the same semantics.
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type} a - First operand
 * @param {import('./Uint128Type.js').Uint128Type} b - Second operand
 * @returns {import('./Uint128Type.js').Uint128Type} Sum (a + b) mod 2^128
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * Uint128.plusWrapping(Uint128.MAX, Uint128.ONE); // 0n
 * ```
 */
export function plusWrapping(a, b) {
	return plus(a, b);
}
