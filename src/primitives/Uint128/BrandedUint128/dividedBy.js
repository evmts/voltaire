/**
 * Divide Uint128 value (integer division)
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint128.js').BrandedUint128} uint - Dividend
 * @param {import('./BrandedUint128.js').BrandedUint128} b - Divisor
 * @returns {import('./BrandedUint128.js').BrandedUint128} Quotient (uint / b)
 * @throws {Error} If divisor is zero
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(100n);
 * const b = Uint128.from(5n);
 * const quotient = Uint128.dividedBy(a, b); // 20n
 * ```
 */
export function dividedBy(uint, b) {
	if (b === 0n) {
		throw new Error("Division by zero");
	}
	return uint / b;
}
