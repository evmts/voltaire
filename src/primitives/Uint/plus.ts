import type { Type } from "./Uint.js";
import { MAX } from "./constants.js";

/**
 * Add Uint256 value with wrapping
 *
 * @param this - First operand
 * @param b - Second operand
 * @returns Sum (this + b) mod 2^256
 *
 * @example
 * ```typescript
 * const a = Uint.from(100);
 * const sum = Uint.plus.call(a, Uint.from(50)); // 150
 * const wrapped = Uint.plus.call(Uint.MAX, Uint.ONE); // 0 (wraps)
 * ```
 */
export function plus(this: Type, b: Type): Type {
	const sum = (this as bigint) + (b as bigint);
	return (sum & MAX) as Type;
}
