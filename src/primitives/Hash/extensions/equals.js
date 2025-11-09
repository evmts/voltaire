/**
 * Compare two hashes for equality
 *
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param {import('./BrandedHash.ts').BrandedHash} hash - First hash
 * @param {import('./BrandedHash.ts').BrandedHash} other - Hash to compare with
 * @returns {boolean} True if hashes are equal
 *
 * @example
 * ```js
 * const hash1 = Hash.from('0x1234...');
 * const hash2 = Hash.from('0x1234...');
 * const same = Hash.equals(hash1, hash2); // true
 * ```
 */
export function equals(hash, other) {
	if (hash.length !== other.length) {
		return false;
	}
	let result = 0;
	for (let i = 0; i < hash.length; i++) {
		result |= (hash[i] ?? 0) ^ (other[i] ?? 0);
	}
	return result === 0;
}
