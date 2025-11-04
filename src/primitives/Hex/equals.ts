import type { BrandedHex } from "./BrandedHex.js";

/**
 * Check if two hex strings are equal
 *
 * @param hex - First hex string
 * @param other - Hex string to compare with
 * @returns True if equal
 *
 * @example
 * ```typescript
 * const hex = Hex('0x1234');
 * const eq1 = Hex.equals(hex, '0x1234' as BrandedHex); // true
 * const eq2 = hex.equals('0x1234' as BrandedHex); // true
 * ```
 */
export function equals(hex: BrandedHex, other: BrandedHex): boolean {
	return hex.toLowerCase() === other.toLowerCase();
}
