import type { Type } from "./Uint.js";

/**
 * Check greater than or equal
 *
 * @param this - First value
 * @param b - Second value
 * @returns true if this >= b
 *
 * @example
 * ```typescript
 * const a = Uint.from(100);
 * const isGreaterOrEqual = Uint.greaterThanOrEqual.call(a, Uint.from(100)); // true
 * ```
 */
export function greaterThanOrEqual(this: Type, b: Type): boolean {
	return (this as bigint) >= (b as bigint);
}
