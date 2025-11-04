import type { BrandedHash } from "./BrandedHash.js";

/**
 * Convert Hash to hex string
 *
 * @param hash - Hash to convert
 * @returns Hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const hash = Hash('0x1234...');
 * const hex = Hash.toHex(hash); // "0x1234..."
 * const hex2 = hash.toHex(); // Same result
 * ```
 */
export function toHex(hash: BrandedHash): string {
	return `0x${Array.from(hash, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}
