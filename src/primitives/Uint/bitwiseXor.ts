import type { BrandedUint } from "./BrandedUint.js";

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
export function bitwiseXor(uint: BrandedUint, b: BrandedUint): BrandedUint {
	return ((uint as bigint) ^ (b as bigint)) as BrandedUint;
}
