import { sha256 as nobleSha256 } from "@noble/hashes/sha2.js";
/**
 * Compute SHA256 hash of input data
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} data - Input data as Uint8Array
 * @returns {import('./SHA256HashType.js').SHA256Hash} 32-byte hash
 * @throws {never}
 * @example
 * ```javascript
 * import { SHA256Hash } from './crypto/SHA256/index.js';
 * const hash = SHA256Hash.from(new Uint8Array([1, 2, 3]));
 * console.log(hash.length); // 32
 * ```
 */
export function hash(data) {
    return /** @type {import('./SHA256HashType.js').SHA256Hash} */ (nobleSha256(data));
}
