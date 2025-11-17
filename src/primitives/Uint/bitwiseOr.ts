import type { Uint256Type } from "./Uint256Type.js";

/**
 * Bitwise OR
 *
 * @param uint - First operand
 * @param b - Second operand
 * @returns uint | b
 *
 * @example
 * ```typescript
 * const a = Uint(0xf0n);
 * const b = Uint(0x0fn);
 * const result1 = Uint.bitwiseOr(a, b); // 0xff
 * const result2 = a.bitwiseOr(b); // 0xff
 * ```
 */
export function bitwiseOr(uint: Uint256Type, b: Uint256Type): Uint256Type {
	return ((uint as bigint) | (b as bigint)) as Uint256Type;
}
