import type { Type } from "./Uint.js";

/**
 * Bitwise AND
 *
 * @param this - First operand
 * @param b - Second operand
 * @returns this & b
 *
 * @example
 * ```typescript
 * const a = Uint.from(0xff);
 * const result = Uint.bitwiseAnd.call(a, Uint.from(0x0f)); // 0x0f
 * ```
 */
export function bitwiseAnd(this: Type, b: Type): Type {
	return ((this as bigint) & (b as bigint)) as Type;
}
