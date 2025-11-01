import type { Type } from "./Uint.js";

/**
 * Count number of set bits (population count)
 *
 * @param this - Value to check
 * @returns Number of 1 bits
 *
 * @example
 * ```typescript
 * const a = Uint.from(0xff);
 * const count = Uint.popCount.call(a); // 8
 * ```
 */
export function popCount(this: Type): number {
	let count = 0;
	let v = this as bigint;
	while (v > 0n) {
		count++;
		v = v & (v - 1n);
	}
	return count;
}
