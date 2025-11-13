import type { BrandedUint256 } from "./BrandedUint256.js";
import { MAX } from "./constants.js";

/**
 * Multiply Uint256 value with wrapping
 *
 * @param uint - First operand
 * @param b - Second operand
 * @returns Product (uint * b) mod 2^256
 *
 * @example
 * ```typescript
 * const a = Uint(10n);
 * const b = Uint(5n);
 * const product1 = Uint.times(a, b); // 50
 * const product2 = a.times(b); // 50
 * ```
 */
export function times(uint: BrandedUint256, b: BrandedUint256): BrandedUint256 {
	const product = (uint as bigint) * (b as bigint);
	return (product & MAX) as BrandedUint256;
}
