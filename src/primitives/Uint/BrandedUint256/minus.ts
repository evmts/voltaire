import type { BrandedUint256 } from "./BrandedUint256.js";
import { MAX } from "./constants.js";

/**
 * Subtract Uint256 value with wrapping
 *
 * @param uint - First operand
 * @param b - Second operand
 * @returns Difference (uint - b) mod 2^256
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(50n);
 * const diff1 = Uint.minus(a, b); // 50
 * const diff2 = a.minus(b); // 50
 * ```
 */
export function minus(uint: BrandedUint256, b: BrandedUint256): BrandedUint256 {
	const diff = (uint as bigint) - (b as bigint);
	if (diff < 0n) {
		return ((MAX as bigint) + 1n + diff) as BrandedUint256;
	}
	return diff as BrandedUint256;
}
