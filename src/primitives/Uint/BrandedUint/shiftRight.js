/**
 * Right shift
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - Value to shift
 * @param {import('./BrandedUint.js').BrandedUint} bits - Number of bits to shift
 * @returns {import('./BrandedUint.js').BrandedUint} uint >> bits
 *
 * @example
 * ```typescript
 * const a = Uint(256n);
 * const b = Uint(8n);
 * const result1 = Uint.shiftRight(a, b); // 1
 * const result2 = a.shiftRight(b); // 1
 * ```
 */
export function shiftRight(uint, bits) {
	return uint >> bits;
}
