import type { Type } from "./Uint.js";

/**
 * Check if value is zero
 *
 * @param this - Value to check
 * @returns true if this === 0
 *
 * @example
 * ```typescript
 * const a = Uint.ZERO;
 * const isZero = Uint.isZero.call(a); // true
 * ```
 */
export function isZero(this: Type): boolean {
	return (this as bigint) === 0n;
}
