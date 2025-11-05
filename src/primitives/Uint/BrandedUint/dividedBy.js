/**
 * Divide Uint256 value
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - Dividend
 * @param {import('./BrandedUint.js').BrandedUint} b - Divisor
 * @returns {import('./BrandedUint.js').BrandedUint} Quotient (uint / b), floor division
 * @throws Error if divisor is zero
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(10n);
 * const quotient1 = Uint.dividedBy(a, b); // 10
 * const quotient2 = a.dividedBy(b); // 10
 * ```
 */
export function dividedBy(uint, b) {
	if (b === 0n) {
		throw new Error("Division by zero");
	}
	return uint / b;
}
