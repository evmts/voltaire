import { Uint16DivisionByZeroError } from "./errors.js";

/**
 * Divide two Uint16 values (integer division)
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./Uint16Type.js').Uint16Type} a - Dividend
 * @param {import('./Uint16Type.js').Uint16Type} b - Divisor
 * @returns {import('./Uint16Type.js').Uint16Type} Quotient (floor(a / b))
 * @throws {Uint16DivisionByZeroError} If divisor is zero
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.from(10000);
 * const b = Uint16.from(100);
 * const quotient = Uint16.dividedBy(a, b); // 100
 * ```
 */
export function dividedBy(a, b) {
	if (b === 0) {
		throw new Uint16DivisionByZeroError("Division by zero", { dividend: a });
	}
	return /** @type {import('./Uint16Type.js').Uint16Type} */ (
		Math.floor(a / b)
	);
}
