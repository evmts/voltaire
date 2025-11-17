import type { Uint256Type } from "./Uint256Type.js";

/**
 * Convert Uint256 to bigint
 *
 * @param uint - Uint256 value to convert
 * @returns bigint value
 *
 * @example
 * ```typescript
 * const value = Uint(255n);
 * const bigint1 = Uint.toBigInt(value);
 * const bigint2 = value.toBigInt();
 * ```
 */
export function toBigInt(uint: Uint256Type): bigint {
	return uint as bigint;
}
