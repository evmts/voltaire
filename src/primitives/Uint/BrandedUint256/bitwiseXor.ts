import type { BrandedUint256 } from "./BrandedUint256.js";

/**
 * Bitwise XOR
 *
 * @param uint - First operand
 * @param b - Second operand
 * @returns uint ^ b
 *
 * @example
 * ```typescript
 * const a = Uint(0xffn);
 * const b = Uint(0x0fn);
 * const result1 = Uint.bitwiseXor(a, b); // 0xf0
 * const result2 = a.bitwiseXor(b); // 0xf0
 * ```
 */
export function bitwiseXor(
	uint: BrandedUint256,
	b: BrandedUint256,
): BrandedUint256 {
	return ((uint as bigint) ^ (b as bigint)) as BrandedUint256;
}
