/**
 * Convert Hash to raw bytes
 *
 * @param {import('./BrandedHash.js').BrandedHash} hash - Hash to convert
 * @returns {Uint8Array} Copy of hash bytes
 *
 * @example
 * ```js
 * const hash = Hash('0x1234...');
 * const bytes = Hash.toBytes(hash);
 * const bytes2 = hash.toBytes(); // Same result
 * ```
 */
export function toBytes(hash) {
	return new Uint8Array(hash);
}
