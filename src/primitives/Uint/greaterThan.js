/**
 * Check greater than
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - First value
 * @param {import('./BrandedUint.js').BrandedUint} b - Second value
 * @returns {boolean} true if uint > b
 *
 * @example
 * ```typescript
 * const a = Uint(200n);
 * const b = Uint(100n);
 * const isGreater1 = Uint.greaterThan(a, b); // true
 * const isGreater2 = a.greaterThan(b); // true
 * ```
 */
export function greaterThan(uint, b) {
	return uint > b;
}
