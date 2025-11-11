/**
 * Check if hash is zero (all bytes are 0)
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {import('./BrandedHash.ts').BrandedHash} hash - Hash to check
 * @returns {boolean} True if hash is all zeros
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * const hash = Hash.from('0x0000...');
 * Hash.isZero(hash); // true
 * ```
 */
export function isZero(hash) {
	return hash.every((byte) => byte === 0);
}
