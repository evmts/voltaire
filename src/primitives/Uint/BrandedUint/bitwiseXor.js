/**
 * Bitwise XOR
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - First operand
 * @param {import('./BrandedUint.js').BrandedUint} b - Second operand
 * @returns {import('./BrandedUint.js').BrandedUint} uint ^ b
 *
 * @example
 * ```typescript
 * const a = Uint(0xffn);
 * const b = Uint(0x0fn);
 * const result1 = Uint.bitwiseXor(a, b); // 0xf0
 * const result2 = a.bitwiseXor(b); // 0xf0
 * ```
 */
export function bitwiseXor(uint, b) {
	return uint ^ b;
}
