import type { BrandedHash } from "./BrandedHash.js";

/**
 * Clone hash
 *
 * @param hash - Hash to clone
 * @returns New hash with same value
 *
 * @example
 * ```typescript
 * const hash = Hash('0x1234...');
 * const copy = Hash.clone(hash);
 * const copy2 = hash.clone(); // Same result
 * ```
 */
export function clone(hash: BrandedHash): BrandedHash {
	return new Uint8Array(hash) as BrandedHash;
}
