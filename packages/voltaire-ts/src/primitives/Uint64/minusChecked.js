import { Uint64NegativeError } from "./errors.js";

/**
 * Subtract two Uint64 values with underflow checking
 *
 * Throws when the exact result does not fit in 64 bits. Every Uint size
 * exposes this function with the same semantics.
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./Uint64Type.js').Uint64Type} a - First operand
 * @param {import('./Uint64Type.js').Uint64Type} b - Second operand
 * @returns {import('./Uint64Type.js').Uint64Type} Difference (a - b)
 * @throws {Uint64NegativeError} If the result is negative
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * Uint64.minusChecked(Uint64.from(5n), Uint64.from(3n)); // 2n
 * Uint64.minusChecked(Uint64.from(0n), Uint64.from(1n)); // throws Uint64NegativeError
 * ```
 */
export function minusChecked(a, b) {
	if (a < b) {
		throw new Uint64NegativeError(`Uint64 underflow: ${a} - ${b} is negative`, {
			value: a - b,
			context: { a, b, operation: "subtraction" },
		});
	}
	return /** @type {import('./Uint64Type.js').Uint64Type} */ (a - b);
}
