import { MAX } from "./constants.js";
import { Uint16OverflowError } from "./errors.js";

/**
 * Multiply two Uint16 values with overflow checking
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./Uint16Type.js').Uint16Type} a - First operand
 * @param {import('./Uint16Type.js').Uint16Type} b - Second operand
 * @returns {import('./Uint16Type.js').Uint16Type} Product (a * b)
 * @throws {Uint16OverflowError} If result exceeds maximum value (65535)
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.from(100);
 * const b = Uint16.from(500);
 * const product = Uint16.times(a, b); // 50000
 * ```
 */
export function times(a, b) {
	const product = a * b;
	if (product > MAX) {
		throw new Uint16OverflowError(
			`Uint16 overflow: ${a} * ${b} = ${product} exceeds maximum (65535)`,
			{ value: product, context: { a, b, operation: "multiplication" } },
		);
	}
	return /** @type {import('./Uint16Type.js').Uint16Type} */ (product);
}
