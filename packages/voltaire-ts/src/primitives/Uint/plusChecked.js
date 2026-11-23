import { MAX } from "./constants.js";
import { UintOverflowError } from "./errors.js";

/**
 * Add two Uint256 values with overflow checking
 *
 * Throws when the exact result does not fit in 256 bits. Every Uint size
 * exposes this function with the same semantics.
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint256 documentation
 * @since 0.0.0
 * @param {import('./Uint256Type.js').Uint256Type} a - First operand
 * @param {import('./Uint256Type.js').Uint256Type} b - Second operand
 * @returns {import('./Uint256Type.js').Uint256Type} Sum (a + b)
 * @throws {UintOverflowError} If the result exceeds 2^256 - 1
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * Uint256.plusChecked(Uint256.from(5n), Uint256.from(3n)); // 8n
 * Uint256.plusChecked(Uint256.MAX, Uint256.ONE); // throws UintOverflowError
 * ```
 */
export function plusChecked(a, b) {
	const sum = a + b;
	if (sum > MAX) {
		throw new UintOverflowError(
			`Uint256 overflow: ${a} + ${b} exceeds maximum (2^256 - 1)`,
			{ value: sum, context: { a, b, operation: "addition" } },
		);
	}
	return /** @type {import('./Uint256Type.js').Uint256Type} */ (sum);
}
