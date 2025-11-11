import { sha256 as nobleSha256 } from "@noble/hashes/sha2.js";

/**
 * Compute SHA256 hash of UTF-8 string
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} str - Input string
 * @returns {Uint8Array} 32-byte hash
 * @throws {never}
 * @example
 * ```javascript
 * import { SHA256 } from './crypto/SHA256/index.js';
 * const hash = SHA256.hashString("hello world");
 * console.log(hash.length); // 32
 * ```
 */
export function hashString(str) {
	const encoder = new TextEncoder();
	const data = encoder.encode(str);
	return nobleSha256(data);
}
