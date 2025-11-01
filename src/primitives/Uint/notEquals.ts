import type { Type } from "./Uint.js";

/**
 * Check inequality
 *
 * @param this - First value
 * @param b - Second value
 * @returns true if this !== b
 *
 * @example
 * ```typescript
 * const a = Uint.from(100);
 * const isNotEqual = Uint.notEquals.call(a, Uint.from(200)); // true
 * ```
 */
export function notEquals(this: Type, b: Type): boolean {
	return (this as bigint) !== (b as bigint);
}
