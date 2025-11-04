import type { BrandedHash } from "./BrandedHash.js";

/**
 * Compare two hashes for equality
 *
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param hash - First hash
 * @param other - Hash to compare with
 * @returns True if hashes are equal
 *
 * @example
 * ```typescript
 * const hash1 = Hash('0x1234...');
 * const hash2 = Hash('0x1234...');
 * const same = Hash.equals(hash1, hash2); // true
 * const same2 = hash1.equals(hash2); // true
 * ```
 */
export function equals(hash: BrandedHash, other: BrandedHash): boolean {
	if (hash.length !== other.length) {
		return false;
	}
	let result = 0;
	for (let i = 0; i < hash.length; i++) {
		result |= hash[i]! ^ other[i]!;
	}
	return result === 0;
}
