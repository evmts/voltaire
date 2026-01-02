import { Uint64DivisionByZeroError } from "./errors.js";

/**
 * Modulo Uint64 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./Uint64Type.js').Uint64Type} uint - Dividend
 * @param {import('./Uint64Type.js').Uint64Type} b - Divisor
 * @returns {import('./Uint64Type.js').Uint64Type} Remainder (uint % b)
 * @throws {Uint64DivisionByZeroError} If divisor is zero
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.from(100n);
 * const b = Uint64.from(3n);
 * const remainder = Uint64.modulo(a, b); // 1n
 * ```
 */
export function modulo(uint, b) {
	if (b === 0n) {
		throw new Uint64DivisionByZeroError("Modulo by zero", { dividend: uint });
	}
	return /** @type {import('./Uint64Type.js').Uint64Type} */ (uint % b);
}
