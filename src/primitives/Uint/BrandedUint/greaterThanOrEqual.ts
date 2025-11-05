import type { BrandedUint } from "./BrandedUint.js";

/**
 * Check greater than or equal
 *
 * @param uint - First value
 * @param b - Second value
 * @returns true if uint >= b
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(100n);
 * const isGte1 = Uint.greaterThanOrEqual(a, b); // true
 * const isGte2 = a.greaterThanOrEqual(b); // true
 * ```
 */
export function greaterThanOrEqual(uint: BrandedUint, b: BrandedUint): boolean {
	return (uint as bigint) >= (b as bigint);
}
