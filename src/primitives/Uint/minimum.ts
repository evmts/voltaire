import type { Type } from "./Uint.js";

/**
 * Get minimum of two values
 *
 * @param this - First value
 * @param b - Second value
 * @returns min(this, b)
 *
 * @example
 * ```typescript
 * const a = Uint.from(100);
 * const min = Uint.minimum.call(a, Uint.from(200)); // 100
 * ```
 */
export function minimum(this: Type, b: Type): Type {
	return (this as bigint) < (b as bigint) ? this : b;
}
