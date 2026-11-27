import { Uint64NegativeError } from "./errors.js";

/**
 * Subtract two Uint64 values with underflow checking
 *
 * Overflow mode: checked (uniform across all Uint sizes).
 * `minusChecked` is an explicit alias and `minusWrapping` wraps mod 2^64.
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./Uint64Type.js').Uint64Type} uint - First operand
 * @param {import('./Uint64Type.js').Uint64Type} b - Second operand
 * @returns {import('./Uint64Type.js').Uint64Type} Difference (uint - b)
 * @throws {Uint64NegativeError} If the result is negative
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.from(100n);
 * const b = Uint64.from(50n);
 * const diff = Uint64.minus(a, b); // 50n
 * ```
 */
export function minus(uint, b) {
	if (uint < b) {
		throw new Uint64NegativeError(
			`Uint64 underflow: ${uint} - ${b} is negative`,
			{ value: uint - b, context: { a: uint, b, operation: "subtraction" } },
		);
	}
	return /** @type {import('./Uint64Type.js').Uint64Type} */ (uint - b);
}
