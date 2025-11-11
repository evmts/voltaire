/**
 * Divide Uint256 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.js').BrandedUint} uint - Dividend
 * @param {import('./BrandedUint.js').BrandedUint} b - Divisor
 * @returns {import('./BrandedUint.js').BrandedUint} Quotient (uint / b), floor division
 * @throws {Error} If divisor is zero
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const a = Uint256.from(100n);
 * const b = Uint256.from(10n);
 * const quotient = Uint256.dividedBy(a, b); // 10n
 * ```
 */
export function dividedBy(uint, b) {
	if (b === 0n) {
		throw new Error("Division by zero");
	}
	return uint / b;
}
