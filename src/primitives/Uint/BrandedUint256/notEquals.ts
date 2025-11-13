import type { BrandedUint256 } from "./BrandedUint256.js";

/**
 * Check inequality
 *
 * @param uint - First value
 * @param b - Second value
 * @returns true if uint !== b
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(200n);
 * const isNotEq1 = Uint.notEquals(a, b); // true
 * const isNotEq2 = a.notEquals(b); // true
 * ```
 */
export function notEquals(uint: BrandedUint256, b: BrandedUint256): boolean {
	return (uint as bigint) !== (b as bigint);
}
