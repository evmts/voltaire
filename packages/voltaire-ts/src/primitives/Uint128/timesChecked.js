import { MAX } from "./constants.js";
import { Uint128OverflowError } from "./errors.js";

/**
 * Multiply two Uint128 values with overflow checking
 *
 * Throws when the exact result does not fit in 128 bits. Every Uint size
 * exposes this function with the same semantics.
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type} a - First operand
 * @param {import('./Uint128Type.js').Uint128Type} b - Second operand
 * @returns {import('./Uint128Type.js').Uint128Type} Product (a * b)
 * @throws {Uint128OverflowError} If the result exceeds 2^128 - 1
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * Uint128.timesChecked(Uint128.from(5n), Uint128.from(3n)); // 15n
 * Uint128.timesChecked(Uint128.MAX, Uint128.from(2n)); // throws Uint128OverflowError
 * ```
 */
export function timesChecked(a, b) {
	const product = a * b;
	if (product > MAX) {
		throw new Uint128OverflowError(
			`Uint128 overflow: ${a} * ${b} exceeds maximum (2^128 - 1)`,
			{ value: product, context: { a, b, operation: "multiplication" } },
		);
	}
	return /** @type {import('./Uint128Type.js').Uint128Type} */ (product);
}
