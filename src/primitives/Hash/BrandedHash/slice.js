/**
 * Get slice of hash
 *
 * @param {import('./BrandedHash.js').BrandedHash} hash - Hash to slice
 * @param {number} [start] - Start index (inclusive)
 * @param {number} [end] - End index (exclusive)
 * @returns {Uint8Array} Slice of hash bytes
 *
 * @example
 * ```js
 * const hash = Hash('0x1234...');
 * const selector = Hash.slice(hash, 0, 4);
 * const selector2 = hash.slice(0, 4); // Same result
 * ```
 */
export function slice(hash, start, end) {
	return hash.slice(start, end);
}
