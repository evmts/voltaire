/**
 * Get minimum of two values
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - First value
 * @param {import('./BrandedUint.js').BrandedUint} b - Second value
 * @returns {import('./BrandedUint.js').BrandedUint} min(uint, b)
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(200n);
 * const min1 = Uint.minimum(a, b); // 100
 * const min2 = a.minimum(b); // 100
 * ```
 */
export function minimum(uint, b) {
	return uint < b ? uint : b;
}
