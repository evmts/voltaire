import type { Type } from "./Uint.js";

/**
 * Get maximum of two values
 *
 * @param this - First value
 * @param b - Second value
 * @returns max(this, b)
 *
 * @example
 * ```typescript
 * const a = Uint.from(100);
 * const max = Uint.maximum.call(a, Uint.from(200)); // 200
 * ```
 */
export function maximum(this: Type, b: Type): Type {
	return (this as bigint) > (b as bigint) ? this : b;
}
