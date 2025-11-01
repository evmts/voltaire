import type { Type } from "./Uint.js";

/**
 * Check equality
 *
 * @param this - First value
 * @param b - Second value
 * @returns true if this === b
 *
 * @example
 * ```typescript
 * const a = Uint.from(100);
 * const isEqual = Uint.equals.call(a, Uint.from(100)); // true
 * ```
 */
export function equals(this: Type, b: Type): boolean {
	return (this as bigint) === (b as bigint);
}
