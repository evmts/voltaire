import type { Uint256Type } from "./Uint256Type.js";

/**
 * Bitwise AND
 *
 * @param uint - First operand
 * @param b - Second operand
 * @returns uint & b
 *
 * @example
 * ```typescript
 * const a = Uint(0xffn);
 * const b = Uint(0x0fn);
 * const result1 = Uint.bitwiseAnd(a, b); // 0x0f
 * const result2 = a.bitwiseAnd(b); // 0x0f
 * ```
 */
export function bitwiseAnd(uint: Uint256Type, b: Uint256Type): Uint256Type {
	return ((uint as bigint) & (b as bigint)) as Uint256Type;
}
