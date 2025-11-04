import { ZERO } from "./BrandedHash.js";

/**
 * Check if hash is zero hash
 *
 * @param {import('./BrandedHash.js').BrandedHash} hash - Hash to check
 * @returns {boolean} True if hash is all zeros
 *
 * @example
 * ```js
 * const hash = Hash('0x00...');
 * const zero = Hash.isZero(hash); // true
 * const zero2 = hash.isZero(); // true
 * ```
 */
export function isZero(hash) {
	if (hash.length !== ZERO.length) {
		return false;
	}
	let result = 0;
	for (let i = 0; i < hash.length; i++) {
		result |= hash[i] ^ ZERO[i];
	}
	return result === 0;
}
