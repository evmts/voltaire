/**
 * Modulo operation
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - Dividend
 * @param {import('./BrandedUint.js').BrandedUint} b - Divisor
 * @returns {import('./BrandedUint.js').BrandedUint} Remainder (uint % b)
 * @throws Error if divisor is zero
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(30n);
 * const remainder1 = Uint.modulo(a, b); // 10
 * const remainder2 = a.modulo(b); // 10
 * ```
 */
export function modulo(uint, b) {
	if (b === 0n) {
		throw new Error("Modulo by zero");
	}
	return uint % b;
}
