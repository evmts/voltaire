import type { BrandedHex } from "./BrandedHex.js";

/**
 * Get byte size of hex
 *
 * @param hex - Hex string
 * @returns Size in bytes
 *
 * @example
 * ```typescript
 * const hex = Hex('0x1234');
 * const s1 = Hex.size(hex); // 2
 * const s2 = hex.size(); // 2
 * ```
 */
export function size(hex: BrandedHex): number {
	return (hex.length - 2) / 2;
}
