import type { BrandedUint256 } from "./BrandedUint256.js";

/**
 * Bitwise AND
 *
 * @param uint - First operand
 * @param b - Second operand
 * @returns uint & b
 *
 * @example
 * ```typescript
 * const a = Uint(0xffn);
 * const b = Uint(0x0fn);
 * const result1 = Uint.bitwiseAnd(a, b); // 0x0f
 * const result2 = a.bitwiseAnd(b); // 0x0f
 * ```
 */
export function bitwiseAnd(uint: BrandedUint256, b: BrandedUint256): BrandedUint256 {
	return ((uint as bigint) & (b as bigint)) as BrandedUint256;
}
