import type { BrandedHex, Sized } from "./BrandedHex.js";

/**
 * Check if hex has specific byte size
 *
 * @param hex - Hex string to check
 * @param targetSize - Expected size in bytes
 * @returns True if size matches
 *
 * @example
 * ```typescript
 * const hex = Hex('0x1234');
 * const is2 = Hex.isSized(hex, 2); // true
 * const is2b = hex.isSized(2); // true
 * ```
 */
export function isSized<TSize extends number>(
	hex: BrandedHex,
	targetSize: TSize,
): hex is Sized<TSize> {
	return (hex.length - 2) / 2 === targetSize;
}
