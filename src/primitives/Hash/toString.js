/**
 * Convert Hash to string (alias for toHex)
 *
 * @param {import('./BrandedHash.js').BrandedHash} hash - Hash to convert
 * @returns {string} Hex string with 0x prefix
 *
 * @example
 * ```js
 * const hash = Hash('0x1234...');
 * const str = Hash.toString(hash);
 * const str2 = hash.toString(); // Same result
 * ```
 */
export function toString(hash) {
	return `0x${Array.from(hash, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}
