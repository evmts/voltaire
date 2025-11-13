import type { BrandedUint256 } from "./BrandedUint256.js";

/**
 * Check greater than
 *
 * @param uint - First value
 * @param b - Second value
 * @returns true if uint > b
 *
 * @example
 * ```typescript
 * const a = Uint(200n);
 * const b = Uint(100n);
 * const isGreater1 = Uint.greaterThan(a, b); // true
 * const isGreater2 = a.greaterThan(b); // true
 * ```
 */
export function greaterThan(uint: BrandedUint256, b: BrandedUint256): boolean {
	return (uint as bigint) > (b as bigint);
}
