import type { BrandedUint256 } from "./BrandedUint256.js";

/**
 * Convert Uint256 to string representation
 *
 * @param uint - Uint256 value to convert
 * @param radix - Base for string conversion (2, 10, 16, etc.)
 * @returns String representation
 *
 * @example
 * ```typescript
 * const value = Uint(255n);
 * const dec1 = Uint.toString(value, 10); // "255"
 * const dec2 = value.toString(10); // "255"
 * const hex = value.toString(16); // "ff"
 * ```
 */
export function toString(uint: BrandedUint256, radix = 10): string {
	return (uint as bigint).toString(radix);
}
