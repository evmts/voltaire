import { MAX } from "./constants.js";
import { Uint16OverflowError } from "./errors.js";

/**
 * Add two Uint16 values with overflow checking
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./Uint16Type.js').Uint16Type} a - First operand
 * @param {import('./Uint16Type.js').Uint16Type} b - Second operand
 * @returns {import('./Uint16Type.js').Uint16Type} Sum (a + b)
 * @throws {Uint16OverflowError} If result exceeds maximum value (65535)
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.from(30000);
 * const b = Uint16.from(20000);
 * const sum = Uint16.plus(a, b); // 50000
 * ```
 */
export function plus(a, b) {
	const sum = a + b;
	if (sum > MAX) {
		throw new Uint16OverflowError(
			`Uint16 overflow: ${a} + ${b} = ${sum} exceeds maximum (65535)`,
			{ value: sum, context: { a, b, operation: "addition" } },
		);
	}
	return /** @type {import('./Uint16Type.js').Uint16Type} */ (sum);
}
