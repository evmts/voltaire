import type { Uint256Type } from "./Uint256Type.js";

/**
 * Check if value is zero
 *
 * @param uint - Value to check
 * @returns true if uint === 0
 *
 * @example
 * ```typescript
 * const a = Uint(0n);
 * const isZero1 = Uint.isZero(a); // true
 * const isZero2 = a.isZero(); // true
 * ```
 */
export function isZero(uint: Uint256Type): boolean {
	return (uint as bigint) === 0n;
}
