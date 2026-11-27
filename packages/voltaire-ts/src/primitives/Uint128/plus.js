import { MAX } from "./constants.js";
import { Uint128OverflowError } from "./errors.js";

/**
 * Add two Uint128 values with overflow checking
 *
 * Overflow mode: checked (uniform across all Uint sizes).
 * `plusChecked` is an explicit alias and `plusWrapping` wraps mod 2^128.
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type} uint - First operand
 * @param {import('./Uint128Type.js').Uint128Type} b - Second operand
 * @returns {import('./Uint128Type.js').Uint128Type} Sum (uint + b)
 * @throws {Uint128OverflowError} If the result exceeds 2^128 - 1
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(100n);
 * const b = Uint128.from(50n);
 * const sum = Uint128.plus(a, b); // 150n
 * ```
 */
export function plus(uint, b) {
	const sum = uint + b;
	if (sum > MAX) {
		throw new Uint128OverflowError(
			`Uint128 overflow: ${uint} + ${b} exceeds maximum (2^128 - 1)`,
			{ value: sum, context: { a: uint, b, operation: "addition" } },
		);
	}
	return /** @type {import('./Uint128Type.js').Uint128Type} */ (sum);
}
