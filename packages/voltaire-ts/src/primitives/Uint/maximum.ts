import type { Uint256Type } from "./Uint256Type.js";

/**
 * Get maximum of two values
 *
 * @param uint - First value
 * @param b - Second value
 * @returns max(uint, b)
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(200n);
 * const max1 = Uint.maximum(a, b); // 200
 * const max2 = a.maximum(b); // 200
 * ```
 */
export function maximum(uint: Uint256Type, b: Uint256Type): Uint256Type {
	return (uint as bigint) > (b as bigint) ? uint : b;
}
