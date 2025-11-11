import { toHex } from "./toHex.js";

/**
 * Convert Hash to string representation
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
 * const str = Hash.toString(hash); // "0x1234..."
 * ```
 */
export function toString(hash) {
	return toHex(hash);
}
