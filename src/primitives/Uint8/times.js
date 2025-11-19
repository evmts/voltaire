import { MAX } from "./constants.js";

/**
 * Multiply two Uint8 values with overflow checking
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {import('./Uint8Type.js').Uint8Type} a - First operand
 * @param {import('./Uint8Type.js').Uint8Type} b - Second operand
 * @returns {import('./Uint8Type.js').Uint8Type} Product (a * b)
 * @throws {Error} If result exceeds maximum value
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const a = Uint8.from(10);
 * const b = Uint8.from(5);
 * const product = Uint8.times(a, b); // 50
 * ```
 */
export function times(a, b) {
	const product = a * b;
	if (product > MAX) {
		throw new Error(
			`Uint8 overflow: ${a} * ${b} = ${product} exceeds maximum (255)`,
		);
	}
	return /** @type {import('./Uint8Type.js').Uint8Type} */ (product);
}
