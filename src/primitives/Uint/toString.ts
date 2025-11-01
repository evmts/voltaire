import type { Type } from "./Uint.js";

/**
 * Convert Uint256 to string representation
 *
 * @param this - Uint256 value to convert
 * @param radix - Base for string conversion (2, 10, 16, etc.)
 * @returns String representation
 *
 * @example
 * ```typescript
 * const value = Uint.from(255);
 * const dec = Uint.toString.call(value, 10); // "255"
 * const hex = Uint.toString.call(value, 16); // "ff"
 * const bin = Uint.toString.call(value, 2); // "11111111"
 * ```
 */
export function toString(this: Type, radix: number = 10): string {
	return (this as bigint).toString(radix);
}
