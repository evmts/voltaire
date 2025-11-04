import type { BrandedHash } from "./BrandedHash.js";

/**
 * Get slice of hash
 *
 * @param hash - Hash to slice
 * @param start - Start index (inclusive)
 * @param end - End index (exclusive)
 * @returns Slice of hash bytes
 *
 * @example
 * ```typescript
 * const hash = Hash('0x1234...');
 * const selector = Hash.slice(hash, 0, 4);
 * const selector2 = hash.slice(0, 4); // Same result
 * ```
 */
export function slice(
	hash: BrandedHash,
	start?: number,
	end?: number,
): Uint8Array {
	return hash.slice(start, end);
}
