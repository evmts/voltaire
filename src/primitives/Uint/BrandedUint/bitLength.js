/**
 * Get number of bits required to represent value
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - Value to check
 * @returns {number} Number of bits (0-256)
 *
 * @example
 * ```typescript
 * const a = Uint(255n);
 * const bits1 = Uint.bitLength(a); // 8
 * const bits2 = a.bitLength(); // 8
 * ```
 */
export function bitLength(uint) {
	if (uint === 0n) return 0;
	return uint.toString(2).length;
}
