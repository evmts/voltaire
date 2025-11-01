import type { Type } from "./Uint.js";
import { MAX } from "./constants.js";

/**
 * Subtract Uint256 value with wrapping
 *
 * @param this - First operand
 * @param b - Second operand
 * @returns Difference (this - b) mod 2^256
 *
 * @example
 * ```typescript
 * const a = Uint.from(100);
 * const diff = Uint.minus.call(a, Uint.from(50)); // 50
 * const wrapped = Uint.minus.call(Uint.ZERO, Uint.ONE); // MAX (wraps)
 * ```
 */
export function minus(this: Type, b: Type): Type {
	const diff = (this as bigint) - (b as bigint);
	if (diff < 0n) {
		return ((MAX as bigint) + 1n + diff) as Type;
	}
	return diff as Type;
}
