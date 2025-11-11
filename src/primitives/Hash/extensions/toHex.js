/**
 * Convert Hash to hex string
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {import('./BrandedHash.ts').BrandedHash} hash - Hash to convert
 * @returns {string} Hex string with 0x prefix
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * const hash = Hash.from('0x1234...');
 * const hex = Hash.toHex(hash); // "0x1234..."
 * ```
 */
export function toHex(hash) {
	return `0x${Array.from(hash, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}
