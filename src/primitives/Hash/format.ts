import type { BrandedHash } from "./BrandedHash.js";

/**
 * Format hash for display (truncated)
 *
 * @param hash - Hash to format
 * @param prefixLength - Number of chars to show at start (default 6)
 * @param suffixLength - Number of chars to show at end (default 4)
 * @returns Formatted string like "0x1234...5678"
 *
 * @example
 * ```typescript
 * const hash = Hash('0x1234...');
 * const display = Hash.format(hash); // "0x1234...5678"
 * const display2 = hash.format(); // Same result
 * ```
 */
export function format(
	hash: BrandedHash,
	prefixLength = 6,
	suffixLength = 4,
): string {
	const hex = `0x${Array.from(hash, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
	if (hex.length <= prefixLength + suffixLength + 2) {
		return hex;
	}
	return `${hex.slice(0, prefixLength + 2)}...${hex.slice(-suffixLength)}`;
}
