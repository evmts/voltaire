/**
 * Modulo operation
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type} uint - Dividend
 * @param {import('./Uint128Type.js').Uint128Type} b - Divisor
 * @returns {import('./Uint128Type.js').Uint128Type} Remainder (uint % b)
 * @throws {Error} If divisor is zero
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(100n);
 * const b = Uint128.from(7n);
 * const remainder = Uint128.modulo(a, b); // 2n
 * ```
 */
export function modulo(uint, b) {
	if (b === 0n) {
		throw new Error("Modulo by zero");
	}
	return /** @type {import('./Uint128Type.js').Uint128Type} */ (uint % b);
}
