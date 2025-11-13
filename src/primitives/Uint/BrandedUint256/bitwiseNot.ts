import type { BrandedUint256 } from "./BrandedUint256.js";
import { MAX } from "./constants.js";

/**
 * Bitwise NOT
 *
 * @param uint - Operand
 * @returns ~uint & MAX
 *
 * @example
 * ```typescript
 * const a = Uint(0n);
 * const result1 = Uint.bitwiseNot(a); // MAX
 * const result2 = a.bitwiseNot(); // MAX
 * ```
 */
export function bitwiseNot(uint: BrandedUint256): BrandedUint256 {
	return (~(uint as bigint) & (MAX as bigint)) as BrandedUint256;
}
