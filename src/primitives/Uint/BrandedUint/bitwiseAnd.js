/**
 * Bitwise AND
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - First operand
 * @param {import('./BrandedUint.js').BrandedUint} b - Second operand
 * @returns {import('./BrandedUint.js').BrandedUint} uint & b
 *
 * @example
 * ```typescript
 * const a = Uint(0xffn);
 * const b = Uint(0x0fn);
 * const result1 = Uint.bitwiseAnd(a, b); // 0x0f
 * const result2 = a.bitwiseAnd(b); // 0x0f
 * ```
 */
export function bitwiseAnd(uint, b) {
	return uint & b;
}
