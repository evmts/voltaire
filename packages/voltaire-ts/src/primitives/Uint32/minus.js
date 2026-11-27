import { Uint32NegativeError } from "./errors.js";

/**
 * Subtract two Uint32 values with underflow checking
 *
 * Overflow mode: checked (uniform across all Uint sizes).
 * `minusChecked` is an explicit alias and `minusWrapping` wraps mod 2^32.
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./Uint32Type.js').Uint32Type} uint - First operand
 * @param {import('./Uint32Type.js').Uint32Type} b - Second operand
 * @returns {import('./Uint32Type.js').Uint32Type} Difference (uint - b)
 * @throws {Uint32NegativeError} If the result is negative
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.from(100);
 * const b = Uint32.from(50);
 * const diff = Uint32.minus(a, b); // 50
 * ```
 */
export function minus(uint, b) {
	if (uint < b) {
		throw new Uint32NegativeError(
			`Uint32 underflow: ${uint} - ${b} is negative`,
			{ value: uint - b, context: { a: uint, b, operation: "subtraction" } },
		);
	}
	return /** @type {import('./Uint32Type.js').Uint32Type} */ (uint - b);
}
