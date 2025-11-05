import type { BrandedUint } from "./BrandedUint.js";
import { MAX } from "./constants.js";

/**
 * Left shift
 *
 * @param uint - Value to shift
 * @param bits - Number of bits to shift
 * @returns uint << bits (mod 2^256)
 *
 * @example
 * ```typescript
 * const a = Uint(1n);
 * const b = Uint(8n);
 * const result1 = Uint.shiftLeft(a, b); // 256
 * const result2 = a.shiftLeft(b); // 256
 * ```
 */
export function shiftLeft(uint: BrandedUint, bits: BrandedUint): BrandedUint {
	const shifted = (uint as bigint) << (bits as bigint);
	return (shifted & (MAX as bigint)) as BrandedUint;
}
