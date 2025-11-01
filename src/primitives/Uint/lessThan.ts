import type { Type } from "./Uint.js";

/**
 * Check less than
 *
 * @param this - First value
 * @param b - Second value
 * @returns true if this < b
 *
 * @example
 * ```typescript
 * const a = Uint.from(100);
 * const isLess = Uint.lessThan.call(a, Uint.from(200)); // true
 * ```
 */
export function lessThan(this: Type, b: Type): boolean {
	return (this as bigint) < (b as bigint);
}
