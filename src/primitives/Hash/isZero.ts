import type { BrandedHash } from "./BrandedHash.js";
import { ZERO } from "./BrandedHash.js";

/**
 * Check if hash is zero hash
 *
 * @param hash - Hash to check
 * @returns True if hash is all zeros
 *
 * @example
 * ```typescript
 * const hash = Hash('0x00...');
 * const zero = Hash.isZero(hash); // true
 * const zero2 = hash.isZero(); // true
 * ```
 */
export function isZero(hash: BrandedHash): boolean {
	if (hash.length !== ZERO.length) {
		return false;
	}
	let result = 0;
	for (let i = 0; i < hash.length; i++) {
		result |= hash[i]! ^ ZERO[i]!;
	}
	return result === 0;
}
