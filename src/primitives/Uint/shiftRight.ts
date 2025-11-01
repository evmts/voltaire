import type { Type } from "./Uint.js";

/**
 * Right shift
 *
 * @param this - Value to shift
 * @param bits - Number of bits to shift
 * @returns this >> bits
 *
 * @example
 * ```typescript
 * const a = Uint.from(256);
 * const result = Uint.shiftRight.call(a, Uint.from(8)); // 1
 * ```
 */
export function shiftRight(this: Type, bits: Type): Type {
	return ((this as bigint) >> (bits as bigint)) as Type;
}
