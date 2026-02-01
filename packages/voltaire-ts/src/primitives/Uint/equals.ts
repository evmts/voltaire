import type { Uint256Type } from "./Uint256Type.js";

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
export function equals(uint: Uint256Type, b: Uint256Type): boolean {
	return (uint as bigint) === (b as bigint);
}
