import type { BrandedHex } from "./BrandedHex.js";

/**
 * Convert bigint to hex
 *
 * @param value - BigInt to convert
 * @param size - Optional byte size for padding
 * @returns Hex string
 *
 * @example
 * ```typescript
 * Hex.fromBigInt(255n);      // '0xff'
 * Hex.fromBigInt(255n, 32);  // '0x00...00ff' (32 bytes)
 * ```
 */
export function fromBigInt(value: bigint, size?: number): BrandedHex {
	let hex = value.toString(16);
	if (size !== undefined) {
		hex = hex.padStart(size * 2, "0");
	}
	return `0x${hex}` as BrandedHex;
}
