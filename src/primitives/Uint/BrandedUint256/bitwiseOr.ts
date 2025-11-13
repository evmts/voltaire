import type { BrandedUint256 } from "./BrandedUint256.js";

/**
 * Bitwise OR
 *
 * @param uint - First operand
 * @param b - Second operand
 * @returns uint | b
 *
 * @example
 * ```typescript
 * const a = Uint(0xf0n);
 * const b = Uint(0x0fn);
 * const result1 = Uint.bitwiseOr(a, b); // 0xff
 * const result2 = a.bitwiseOr(b); // 0xff
 * ```
 */
export function bitwiseOr(uint: BrandedUint256, b: BrandedUint256): BrandedUint256 {
	return ((uint as bigint) | (b as bigint)) as BrandedUint256;
}
