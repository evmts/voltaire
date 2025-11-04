import type { BrandedHex } from "./BrandedHex.js";

/**
 * Convert hex to bigint
 *
 * @param hex - Hex string to convert
 * @returns BigInt value
 *
 * @example
 * ```typescript
 * const hex = Hex('0xff');
 * const big1 = Hex.toBigInt(hex); // 255n
 * const big2 = hex.toBigInt(); // 255n
 * ```
 */
export function toBigInt(hex: BrandedHex): bigint {
	return BigInt(hex);
}
