/**
 * Check inequality
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - First value
 * @param {import('./BrandedUint.js').BrandedUint} b - Second value
 * @returns {boolean} true if uint !== b
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(200n);
 * const notEq1 = Uint.notEquals(a, b); // true
 * const notEq2 = a.notEquals(b); // true
 * ```
 */
export function notEquals(uint, b) {
	return uint !== b;
}
