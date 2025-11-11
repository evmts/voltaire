/**
 * Convert Hash to string (alias for toHex)
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {import('./BrandedHash.js').BrandedHash} hash - Hash to convert
 * @returns {string} Hex string with 0x prefix
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * const hash = Hash.from('0x1234...');
 * const str = Hash.toString(hash);
 * ```
 */
export function toString(hash) {
	return `0x${Array.from(hash, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}
