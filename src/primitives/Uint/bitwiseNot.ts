import type { Uint256Type } from "./Uint256Type.js";
import { MAX } from "./constants.js";

/**
 * Bitwise NOT
 *
 * @param uint - Operand
 * @returns ~uint & MAX
 *
 * @example
 * ```typescript
 * const a = Uint(0n);
 * const result1 = Uint.bitwiseNot(a); // MAX
 * const result2 = a.bitwiseNot(); // MAX
 * ```
 */
export function bitwiseNot(uint: Uint256Type): Uint256Type {
	return (~(uint as bigint) & (MAX as bigint)) as Uint256Type;
}
