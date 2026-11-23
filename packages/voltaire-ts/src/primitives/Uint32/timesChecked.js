import { MAX } from "./constants.js";
import { Uint32OverflowError } from "./errors.js";

/**
 * Multiply two Uint32 values with overflow checking
 *
 * Throws when the exact result does not fit in 32 bits. Every Uint size
 * exposes this function with the same semantics.
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./Uint32Type.js').Uint32Type} a - First operand
 * @param {import('./Uint32Type.js').Uint32Type} b - Second operand
 * @returns {import('./Uint32Type.js').Uint32Type} Product (a * b)
 * @throws {Uint32OverflowError} If the result exceeds 2^32 - 1
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * Uint32.timesChecked(Uint32.from(5), Uint32.from(3)); // 15
 * Uint32.timesChecked(Uint32.MAX, Uint32.from(2)); // throws Uint32OverflowError
 * ```
 */
export function timesChecked(a, b) {
	const product = a * b;
	if (product > MAX) {
		throw new Uint32OverflowError(
			`Uint32 overflow: ${a} * ${b} exceeds maximum (2^32 - 1)`,
			{ value: product, context: { a, b, operation: "multiplication" } },
		);
	}
	return /** @type {import('./Uint32Type.js').Uint32Type} */ (product);
}
