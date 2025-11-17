import type { Uint256Type } from "./Uint256Type.js";

/**
 * Right shift
 *
 * @param uint - Value to shift
 * @param bits - Number of bits to shift
 * @returns uint >> bits
 *
 * @example
 * ```typescript
 * const a = Uint(256n);
 * const b = Uint(8n);
 * const result1 = Uint.shiftRight(a, b); // 1
 * const result2 = a.shiftRight(b); // 1
 * ```
 */
export function shiftRight(uint: Uint256Type, bits: Uint256Type): Uint256Type {
	return ((uint as bigint) >> (bits as bigint)) as Uint256Type;
}
