/**
 * Divide two Uint8 values (integer division)
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {import('./Uint8Type.js').Uint8Type} a - Dividend
 * @param {import('./Uint8Type.js').Uint8Type} b - Divisor
 * @returns {import('./Uint8Type.js').Uint8Type} Quotient (floor(a / b))
 * @throws {Error} If divisor is zero
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const a = Uint8.from(100);
 * const b = Uint8.from(5);
 * const quotient = Uint8.dividedBy(a, b); // 20
 * ```
 */
export function dividedBy(a, b) {
	if (b === 0) {
		throw new Error("Division by zero");
	}
	return /** @type {import('./Uint8Type.js').Uint8Type} */ (Math.floor(a / b));
}
