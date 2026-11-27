import { MAX } from "./constants.js";
import { Uint32OverflowError } from "./errors.js";

/**
 * Multiply two Uint32 values with overflow checking
 *
 * Overflow mode: checked (uniform across all Uint sizes).
 * `timesChecked` is an explicit alias and `timesWrapping` wraps mod 2^32.
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./Uint32Type.js').Uint32Type} uint - First operand
 * @param {import('./Uint32Type.js').Uint32Type} b - Second operand
 * @returns {import('./Uint32Type.js').Uint32Type} Product (uint * b)
 * @throws {Uint32OverflowError} If the result exceeds 2^32 - 1
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.from(100);
 * const b = Uint32.from(50);
 * const product = Uint32.times(a, b); // 5000
 * ```
 */
export function times(uint, b) {
	const product = uint * b;
	if (product > MAX) {
		throw new Uint32OverflowError(
			`Uint32 overflow: ${uint} * ${b} exceeds maximum (2^32 - 1)`,
			{ value: product, context: { a: uint, b, operation: "multiplication" } },
		);
	}
	return /** @type {import('./Uint32Type.js').Uint32Type} */ (product);
}
