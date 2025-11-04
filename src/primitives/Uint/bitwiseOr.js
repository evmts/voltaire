/**
 * Bitwise OR
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - First operand
 * @param {import('./BrandedUint.js').BrandedUint} b - Second operand
 * @returns {import('./BrandedUint.js').BrandedUint} uint | b
 *
 * @example
 * ```typescript
 * const a = Uint(0xf0n);
 * const b = Uint(0x0fn);
 * const result1 = Uint.bitwiseOr(a, b); // 0xff
 * const result2 = a.bitwiseOr(b); // 0xff
 * ```
 */
export function bitwiseOr(uint, b) {
	return uint | b;
}
