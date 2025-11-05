/**
 * Get maximum of two values
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - First value
 * @param {import('./BrandedUint.js').BrandedUint} b - Second value
 * @returns {import('./BrandedUint.js').BrandedUint} max(uint, b)
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(200n);
 * const max1 = Uint.maximum(a, b); // 200
 * const max2 = a.maximum(b); // 200
 * ```
 */
export function maximum(uint, b) {
	return uint > b ? uint : b;
}
