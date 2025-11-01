import type { Type } from "./Uint.js";

/**
 * Convert Uint256 to bigint
 *
 * @param this - Uint256 value to convert
 * @returns bigint value
 *
 * @example
 * ```typescript
 * const value = Uint.from(255);
 * const bigint = Uint.toBigInt.call(value);
 * ```
 */
export function toBigInt(this: Type): bigint {
	return this as bigint;
}
