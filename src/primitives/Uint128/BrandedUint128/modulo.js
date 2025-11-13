/**
 * Modulo operation
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint128.js').BrandedUint128} uint - Dividend
 * @param {import('./BrandedUint128.js').BrandedUint128} b - Divisor
 * @returns {import('./BrandedUint128.js').BrandedUint128} Remainder (uint % b)
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
	return uint % b;
}
