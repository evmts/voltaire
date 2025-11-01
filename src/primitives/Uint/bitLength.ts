import type { Type } from "./Uint.js";

/**
 * Get number of bits required to represent value
 *
 * @param this - Value to check
 * @returns Number of bits (0-256)
 *
 * @example
 * ```typescript
 * const a = Uint.from(255);
 * const bits = Uint.bitLength.call(a); // 8
 * const bits2 = Uint.bitLength.call(Uint.from(256)); // 9
 * ```
 */
export function bitLength(this: Type): number {
	if ((this as bigint) === 0n) return 0;
	return (this as bigint).toString(2).length;
}
