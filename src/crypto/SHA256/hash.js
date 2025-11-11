import { sha256 as nobleSha256 } from "@noble/hashes/sha2.js";

/**
 * Compute SHA256 hash of input data
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} data - Input data as Uint8Array
 * @returns {Uint8Array} 32-byte hash
 * @throws {never}
 * @example
 * ```javascript
 * import { SHA256 } from './crypto/SHA256/index.js';
 * const hash = SHA256.hash(new Uint8Array([1, 2, 3]));
 * console.log(hash.length); // 32
 * ```
 */
export function hash(data) {
	return nobleSha256(data);
}
