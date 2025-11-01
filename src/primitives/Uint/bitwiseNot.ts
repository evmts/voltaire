import type { Type } from "./Uint.js";
import { MAX } from "./constants.js";

/**
 * Bitwise NOT
 *
 * @param this - Operand
 * @returns ~this & MAX
 *
 * @example
 * ```typescript
 * const a = Uint.ZERO;
 * const result = Uint.bitwiseNot.call(a); // MAX
 * ```
 */
export function bitwiseNot(this: Type): Type {
	return (~(this as bigint) & (MAX as bigint)) as Type;
}
