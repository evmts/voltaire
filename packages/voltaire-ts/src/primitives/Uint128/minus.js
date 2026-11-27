import { Uint128NegativeError } from "./errors.js";

/**
 * Subtract two Uint128 values with underflow checking
 *
 * Overflow mode: checked (uniform across all Uint sizes).
 * `minusChecked` is an explicit alias and `minusWrapping` wraps mod 2^128.
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type} uint - First operand
 * @param {import('./Uint128Type.js').Uint128Type} b - Second operand
 * @returns {import('./Uint128Type.js').Uint128Type} Difference (uint - b)
 * @throws {Uint128NegativeError} If the result is negative
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(100n);
 * const b = Uint128.from(50n);
 * const diff = Uint128.minus(a, b); // 50n
 * ```
 */
export function minus(uint, b) {
	if (uint < b) {
		throw new Uint128NegativeError(
			`Uint128 underflow: ${uint} - ${b} is negative`,
			{ value: uint - b, context: { a: uint, b, operation: "subtraction" } },
		);
	}
	return /** @type {import('./Uint128Type.js').Uint128Type} */ (uint - b);
}
