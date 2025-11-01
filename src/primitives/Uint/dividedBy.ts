import type { Type } from "./Uint.js";

/**
 * Divide Uint256 value
 *
 * @param this - Dividend
 * @param b - Divisor
 * @returns Quotient (this / b), floor division
 * @throws Error if divisor is zero
 *
 * @example
 * ```typescript
 * const a = Uint.from(100);
 * const quotient = Uint.dividedBy.call(a, Uint.from(10)); // 10
 * ```
 */
export function dividedBy(this: Type, b: Type): Type {
	if ((b as bigint) === 0n) {
		throw new Error("Division by zero");
	}
	return ((this as bigint) / (b as bigint)) as Type;
}
