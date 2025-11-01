import type { Type } from "./Uint.js";
import { MAX } from "./constants.js";

/**
 * Multiply Uint256 value with wrapping
 *
 * @param this - First operand
 * @param b - Second operand
 * @returns Product (this * b) mod 2^256
 *
 * @example
 * ```typescript
 * const a = Uint.from(10);
 * const product = Uint.times.call(a, Uint.from(5)); // 50
 * ```
 */
export function times(this: Type, b: Type): Type {
	const product = (this as bigint) * (b as bigint);
	return (product & MAX) as Type;
}
