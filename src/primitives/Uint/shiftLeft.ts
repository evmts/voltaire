import type { Type } from "./Uint.js";
import { MAX } from "./constants.js";

/**
 * Left shift
 *
 * @param this - Value to shift
 * @param bits - Number of bits to shift
 * @returns this << bits (mod 2^256)
 *
 * @example
 * ```typescript
 * const a = Uint.from(1);
 * const result = Uint.shiftLeft.call(a, Uint.from(8)); // 256
 * ```
 */
export function shiftLeft(this: Type, bits: Type): Type {
	const shifted = (this as bigint) << (bits as bigint);
	return (shifted & (MAX as bigint)) as Type;
}
