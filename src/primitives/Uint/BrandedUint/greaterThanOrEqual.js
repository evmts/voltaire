/**
 * Check greater than or equal
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - First value
 * @param {import('./BrandedUint.js').BrandedUint} b - Second value
 * @returns {boolean} true if uint >= b
 *
 * @example
 * ```typescript
 * const a = Uint(200n);
 * const b = Uint(200n);
 * const isGreaterOrEqual1 = Uint.greaterThanOrEqual(a, b); // true
 * const isGreaterOrEqual2 = a.greaterThanOrEqual(b); // true
 * ```
 */
export function greaterThanOrEqual(uint, b) {
	return uint >= b;
}
