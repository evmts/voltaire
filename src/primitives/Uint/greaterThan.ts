import type { Type } from "./Uint.js";

/**
 * Check greater than
 *
 * @param this - First value
 * @param b - Second value
 * @returns true if this > b
 *
 * @example
 * ```typescript
 * const a = Uint.from(200);
 * const isGreater = Uint.greaterThan.call(a, Uint.from(100)); // true
 * ```
 */
export function greaterThan(this: Type, b: Type): boolean {
	return (this as bigint) > (b as bigint);
}
