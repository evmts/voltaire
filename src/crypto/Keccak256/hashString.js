import { hash } from "./hash.js";

/**
 * Hash string with Keccak-256
 *
 * String is UTF-8 encoded before hashing.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} str - String to hash
 * @returns {import('../../primitives/Hash/index.js').BrandedHash} 32-byte hash
 * @throws {never}
 * @example
 * ```javascript
 * import * as Keccak256 from './crypto/Keccak256/index.js';
 * const hash = Keccak256.hashString('hello');
 * ```
 */
export function hashString(str) {
	const encoder = new TextEncoder();
	return hash(encoder.encode(str));
}
