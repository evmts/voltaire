/**
 * Check if value is zero
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - Value to check
 * @returns {boolean} true if uint === 0
 *
 * @example
 * ```typescript
 * const a = Uint(0n);
 * const isZero1 = Uint.isZero(a); // true
 * const isZero2 = a.isZero(); // true
 * ```
 */
export function isZero(uint) {
	return uint === 0n;
}
