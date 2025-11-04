import type { BrandedHex } from "./BrandedHex.js";

/**
 * Convert hex to number
 *
 * @param hex - Hex string to convert
 * @returns Number value
 * @throws {RangeError} If hex represents value larger than MAX_SAFE_INTEGER
 *
 * @example
 * ```typescript
 * const hex = Hex('0xff');
 * const num1 = Hex.toNumber(hex); // 255
 * const num2 = hex.toNumber(); // 255
 * ```
 */
export function toNumber(hex: BrandedHex): number {
	const num = Number.parseInt(hex.slice(2), 16);
	if (!Number.isSafeInteger(num)) {
		throw new RangeError("Hex value exceeds MAX_SAFE_INTEGER");
	}
	return num;
}
