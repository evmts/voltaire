import type { BrandedUint256 } from "./BrandedUint256.js";

/**
 * Divide Uint256 value
 *
 * @param uint - Dividend
 * @param b - Divisor
 * @returns Quotient (uint / b), floor division
 * @throws Error if divisor is zero
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(10n);
 * const quotient1 = Uint.dividedBy(a, b); // 10
 * const quotient2 = a.dividedBy(b); // 10
 * ```
 */
export function dividedBy(uint: BrandedUint256, b: BrandedUint256): BrandedUint256 {
	if ((b as bigint) === 0n) {
		throw new Error("Division by zero");
	}
	return ((uint as bigint) / (b as bigint)) as BrandedUint256;
}
