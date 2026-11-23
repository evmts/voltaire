import { MAX } from "./constants.js";
import { Uint64OverflowError } from "./errors.js";

/**
 * Multiply two Uint64 values with overflow checking
 *
 * Throws when the exact result does not fit in 64 bits. Every Uint size
 * exposes this function with the same semantics.
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./Uint64Type.js').Uint64Type} a - First operand
 * @param {import('./Uint64Type.js').Uint64Type} b - Second operand
 * @returns {import('./Uint64Type.js').Uint64Type} Product (a * b)
 * @throws {Uint64OverflowError} If the result exceeds 2^64 - 1
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * Uint64.timesChecked(Uint64.from(5n), Uint64.from(3n)); // 15n
 * Uint64.timesChecked(Uint64.MAX, Uint64.from(2n)); // throws Uint64OverflowError
 * ```
 */
export function timesChecked(a, b) {
	const product = a * b;
	if (product > MAX) {
		throw new Uint64OverflowError(
			`Uint64 overflow: ${a} * ${b} exceeds maximum (2^64 - 1)`,
			{ value: product, context: { a, b, operation: "multiplication" } },
		);
	}
	return /** @type {import('./Uint64Type.js').Uint64Type} */ (product);
}
