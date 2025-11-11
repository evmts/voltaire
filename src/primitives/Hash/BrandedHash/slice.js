/**
 * Get slice of hash
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {import('./BrandedHash.js').BrandedHash} hash - Hash to slice
 * @param {number} [start] - Start index (inclusive)
 * @param {number} [end] - End index (exclusive)
 * @returns {Uint8Array} Slice of hash bytes
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * const hash = Hash.from('0x1234...');
 * const selector = Hash.slice(hash, 0, 4);
 * ```
 */
export function slice(hash, start, end) {
	return hash.slice(start, end);
}
