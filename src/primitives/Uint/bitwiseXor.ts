import type { Type } from "./Uint.js";

/**
 * Bitwise XOR
 *
 * @param this - First operand
 * @param b - Second operand
 * @returns this ^ b
 *
 * @example
 * ```typescript
 * const a = Uint.from(0xff);
 * const result = Uint.bitwiseXor.call(a, Uint.from(0x0f)); // 0xf0
 * ```
 */
export function bitwiseXor(this: Type, b: Type): Type {
	return ((this as bigint) ^ (b as bigint)) as Type;
}
