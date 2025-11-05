import type { BrandedUint } from "./BrandedUint.js";

/**
 * Count number of set bits (population count)
 *
 * @param uint - Value to check
 * @returns Number of 1 bits
 *
 * @example
 * ```typescript
 * const a = Uint(0xffn);
 * const count1 = Uint.popCount(a); // 8
 * const count2 = a.popCount(); // 8
 * ```
 */
export function popCount(uint: BrandedUint): number {
	let count = 0;
	let v = uint as bigint;
	while (v > 0n) {
		count++;
		v = v & (v - 1n);
	}
	return count;
}
