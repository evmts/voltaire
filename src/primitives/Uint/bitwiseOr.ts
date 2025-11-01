import type { Type } from "./Uint.js";

/**
 * Bitwise OR
 *
 * @param this - First operand
 * @param b - Second operand
 * @returns this | b
 *
 * @example
 * ```typescript
 * const a = Uint.from(0xf0);
 * const result = Uint.bitwiseOr.call(a, Uint.from(0x0f)); // 0xff
 * ```
 */
export function bitwiseOr(this: Type, b: Type): Type {
	return ((this as bigint) | (b as bigint)) as Type;
}
