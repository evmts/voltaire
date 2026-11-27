import { MAX } from "./constants.js";

/**
 * Subtract two Uint64 values with wrapping
 *
 * Returns the exact result modulo 2^64 and never throws. Every Uint size
 * exposes this function with the same semantics.
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./Uint64Type.js').Uint64Type} a - First operand
 * @param {import('./Uint64Type.js').Uint64Type} b - Second operand
 * @returns {import('./Uint64Type.js').Uint64Type} Difference (a - b) mod 2^64
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * Uint64.minusWrapping(Uint64.from(0n), Uint64.from(1n)); // Uint64.MAX
 * ```
 */
export function minusWrapping(a, b) {
	return /** @type {import('./Uint64Type.js').Uint64Type} */ ((a - b) & MAX);
}
