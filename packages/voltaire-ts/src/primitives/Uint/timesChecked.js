import { MAX } from "./constants.js";
import { UintOverflowError } from "./errors.js";

/**
 * Multiply two Uint256 values with overflow checking
 *
 * Throws when the exact result does not fit in 256 bits. Every Uint size
 * exposes this function with the same semantics.
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint256 documentation
 * @since 0.0.0
 * @param {import('./Uint256Type.js').Uint256Type} a - First operand
 * @param {import('./Uint256Type.js').Uint256Type} b - Second operand
 * @returns {import('./Uint256Type.js').Uint256Type} Product (a * b)
 * @throws {UintOverflowError} If the result exceeds 2^256 - 1
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * Uint256.timesChecked(Uint256.from(5n), Uint256.from(3n)); // 15n
 * Uint256.timesChecked(Uint256.MAX, Uint256.from(2n)); // throws UintOverflowError
 * ```
 */
export function timesChecked(a, b) {
	const product = a * b;
	if (product > MAX) {
		throw new UintOverflowError(
			`Uint256 overflow: ${a} * ${b} exceeds maximum (2^256 - 1)`,
			{ value: product, context: { a, b, operation: "multiplication" } },
		);
	}
	return /** @type {import('./Uint256Type.js').Uint256Type} */ (product);
}
