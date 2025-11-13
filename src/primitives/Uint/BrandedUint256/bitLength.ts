import type { BrandedUint256 } from "./BrandedUint256.js";

/**
 * Get number of bits required to represent value
 *
 * @param uint - Value to check
 * @returns Number of bits (0-256)
 *
 * @example
 * ```typescript
 * const a = Uint(255n);
 * const bits1 = Uint.bitLength(a); // 8
 * const bits2 = a.bitLength(); // 8
 * ```
 */
export function bitLength(uint: BrandedUint256): number {
	if ((uint as bigint) === 0n) return 0;
	return (uint as bigint).toString(2).length;
}
