import { keccak256 } from "./keccak256.js";

/**
 * Hash string with Keccak-256
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {string} str - String to hash (UTF-8 encoded)
 * @returns {import('./BrandedHash.js').BrandedHash} 32-byte hash
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * const hash = Hash.keccak256String('hello');
 * ```
 */
export function keccak256String(str) {
	const encoder = new TextEncoder();
	return keccak256(encoder.encode(str));
}
