import type { BrandedUint256 } from "./BrandedUint256.js";

/**
 * Check equality
 *
 * @param uint - First value
 * @param b - Second value
 * @returns true if uint === b
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(100n);
 * const eq1 = Uint.equals(a, b); // true
 * const eq2 = a.equals(b); // true
 * ```
 */
export function equals(uint: BrandedUint256, b: BrandedUint256): boolean {
	return (uint as bigint) === (b as bigint);
}
