/**
 * Convert Hash to raw bytes
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {import('./BrandedHash.js').BrandedHash} hash - Hash to convert
 * @returns {Uint8Array} Copy of hash bytes
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * const hash = Hash.from('0x1234...');
 * const bytes = Hash.toBytes(hash);
 * ```
 */
export function toBytes(hash) {
	return new Uint8Array(hash);
}
