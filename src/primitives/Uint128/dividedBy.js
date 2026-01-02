import { Uint128DivisionByZeroError } from "./errors.js";

/**
 * Divide Uint128 value (integer division)
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type} uint - Dividend
 * @param {import('./Uint128Type.js').Uint128Type} b - Divisor
 * @returns {import('./Uint128Type.js').Uint128Type} Quotient (uint / b)
 * @throws {Uint128DivisionByZeroError} If divisor is zero
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(100n);
 * const b = Uint128.from(5n);
 * const quotient = Uint128.dividedBy(a, b); // 20n
 * ```
 */
export function dividedBy(uint, b) {
	if (b === 0n) {
		throw new Uint128DivisionByZeroError("Division by zero", {
			dividend: uint,
		});
	}
	return /** @type {import('./Uint128Type.js').Uint128Type} */ (uint / b);
}
