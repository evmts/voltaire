/**
 * Check less than or equal
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - First value
 * @param {import('./BrandedUint.js').BrandedUint} b - Second value
 * @returns {boolean} true if uint <= b
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(100n);
 * const isLessOrEqual1 = Uint.lessThanOrEqual(a, b); // true
 * const isLessOrEqual2 = a.lessThanOrEqual(b); // true
 * ```
 */
export function lessThanOrEqual(uint, b) {
	return uint <= b;
}
