import { MAX } from "./constants.js";
import { Uint128OverflowError } from "./errors.js";

/**
 * Multiply two Uint128 values with overflow checking
 *
 * Overflow mode: checked (uniform across all Uint sizes).
 * `timesChecked` is an explicit alias and `timesWrapping` wraps mod 2^128.
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type} uint - First operand
 * @param {import('./Uint128Type.js').Uint128Type} b - Second operand
 * @returns {import('./Uint128Type.js').Uint128Type} Product (uint * b)
 * @throws {Uint128OverflowError} If the result exceeds 2^128 - 1
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(10n);
 * const b = Uint128.from(5n);
 * const product = Uint128.times(a, b); // 50n
 * ```
 */
export function times(uint, b) {
	const product = uint * b;
	if (product > MAX) {
		throw new Uint128OverflowError(
			`Uint128 overflow: ${uint} * ${b} exceeds maximum (2^128 - 1)`,
			{ value: product, context: { a: uint, b, operation: "multiplication" } },
		);
	}
	return /** @type {import('./Uint128Type.js').Uint128Type} */ (product);
}
