/**
 * Check if hash is zero (all bytes are 0)
 *
 * @param {import('./BrandedHash.ts').BrandedHash} hash - Hash to check
 * @returns {boolean} True if hash is all zeros
 *
 * @example
 * ```js
 * const hash = Hash.from('0x0000...');
 * Hash.isZero(hash); // true
 * ```
 */
export function isZero(hash) {
	return hash.every((byte) => byte === 0);
}
