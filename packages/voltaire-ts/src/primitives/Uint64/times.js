import { MAX } from "./constants.js";
import { Uint64OverflowError } from "./errors.js";

/**
 * Multiply two Uint64 values with overflow checking
 *
 * Overflow mode: checked (uniform across all Uint sizes).
 * `timesChecked` is an explicit alias and `timesWrapping` wraps mod 2^64.
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./Uint64Type.js').Uint64Type} uint - First operand
 * @param {import('./Uint64Type.js').Uint64Type} b - Second operand
 * @returns {import('./Uint64Type.js').Uint64Type} Product (uint * b)
 * @throws {Uint64OverflowError} If the result exceeds 2^64 - 1
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.from(100n);
 * const b = Uint64.from(50n);
 * const product = Uint64.times(a, b); // 5000n
 * ```
 */
export function times(uint, b) {
	const product = uint * b;
	if (product > MAX) {
		throw new Uint64OverflowError(
			`Uint64 overflow: ${uint} * ${b} exceeds maximum (2^64 - 1)`,
			{ value: product, context: { a: uint, b, operation: "multiplication" } },
		);
	}
	return /** @type {import('./Uint64Type.js').Uint64Type} */ (product);
}
