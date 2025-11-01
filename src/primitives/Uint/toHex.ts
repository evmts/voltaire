import type { Type } from "./Uint.js";

/**
 * Convert Uint256 to hex string
 *
 * @param this - Uint256 value to convert
 * @param padded - Whether to pad to 64 characters (32 bytes)
 * @returns Hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const value = Uint.from(255);
 * const hex = Uint.toHex.call(value); // "0x00...ff"
 * const hex2 = Uint.toHex.call(value, false); // "0xff"
 * ```
 */
export function toHex(this: Type, padded = true): string {
	const hex = (this as bigint).toString(16);
	return padded ? `0x${hex.padStart(64, "0")}` : `0x${hex}`;
}
