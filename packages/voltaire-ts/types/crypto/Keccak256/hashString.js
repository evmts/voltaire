import { hash } from "./hash.js";
/**
 * Hash string with Keccak-256
 *
 * String is UTF-8 encoded before hashing.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} str - String to hash
 * @returns {import('./Keccak256HashType.js').Keccak256Hash} 32-byte hash
 * @throws {never}
 * @example
 * ```javascript
 * import { Keccak256Hash } from './crypto/Keccak256/index.js';
 * const hash = Keccak256Hash.fromString('hello');
 * ```
 */
export function hashString(str) {
    const encoder = new TextEncoder();
    return hash(encoder.encode(str));
}
