import type { BrandedHash } from "./BrandedHash.js";

/**
 * Convert Hash to raw bytes
 *
 * @param hash - Hash to convert
 * @returns Copy of hash bytes
 *
 * @example
 * ```typescript
 * const hash = Hash('0x1234...');
 * const bytes = Hash.toBytes(hash);
 * const bytes2 = hash.toBytes(); // Same result
 * ```
 */
export function toBytes(hash: BrandedHash): Uint8Array {
	return new Uint8Array(hash);
}
