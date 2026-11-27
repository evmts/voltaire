import { MAX } from "./constants.js";

/**
 * Subtract two Uint128 values with wrapping
 *
 * Returns the exact result modulo 2^128 and never throws. Every Uint size
 * exposes this function with the same semantics.
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type} a - First operand
 * @param {import('./Uint128Type.js').Uint128Type} b - Second operand
 * @returns {import('./Uint128Type.js').Uint128Type} Difference (a - b) mod 2^128
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * Uint128.minusWrapping(Uint128.from(0n), Uint128.from(1n)); // Uint128.MAX
 * ```
 */
export function minusWrapping(a, b) {
	const diff = a - b;
	return /** @type {import('./Uint128Type.js').Uint128Type} */ (
		diff < 0n ? (diff + MAX + 1n) & MAX : diff
	);
}
