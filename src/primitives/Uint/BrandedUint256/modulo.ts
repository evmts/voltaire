import type { BrandedUint256 } from "./BrandedUint256.js";

/**
 * Modulo operation
 *
 * @param uint - Dividend
 * @param b - Divisor
 * @returns Remainder (uint % b)
 * @throws Error if divisor is zero
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(30n);
 * const remainder1 = Uint.modulo(a, b); // 10
 * const remainder2 = a.modulo(b); // 10
 * ```
 */
export function modulo(uint: BrandedUint256, b: BrandedUint256): BrandedUint256 {
	if ((b as bigint) === 0n) {
		throw new Error("Modulo by zero");
	}
	return ((uint as bigint) % (b as bigint)) as BrandedUint256;
}
