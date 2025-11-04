import type { BrandedHash } from "./BrandedHash.js";

/**
 * Convert Hash to string (alias for toHex)
 *
 * @param hash - Hash to convert
 * @returns Hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const hash = Hash('0x1234...');
 * const str = Hash.toString(hash);
 * const str2 = hash.toString(); // Same result
 * ```
 */
export function toString(hash: BrandedHash): string {
	return `0x${Array.from(hash, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}
