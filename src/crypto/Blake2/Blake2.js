// @ts-nocheck
import { hash } from "./hash.js";
import { hashString } from "./hashString.js";

// Export individual functions
export { hash, hashString };

/**
 * Blake2 constructor - auto-detects input type (string or bytes)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string | Uint8Array} data - Data to hash (auto-detects type)
 * @param {number} [outputLength=64] - Output length in bytes (1-64, default 64)
 * @returns {Uint8Array} BLAKE2b hash
 * @throws {Error} If outputLength is invalid
 * @example
 * ```javascript
 * import { Blake2 } from './crypto/Blake2/index.js';
 * const hash1 = Blake2("hello");           // String, 64 bytes
 * const hash2 = Blake2("hello", 32);       // String, 32 bytes
 * const hash3 = Blake2(new Uint8Array([1, 2, 3]), 32); // Bytes, 32 bytes
 * ```
 */
export function Blake2(data, outputLength = 64) {
	return hash(data, outputLength);
}

// Attach namespace methods for backward compatibility
Blake2.hash = hash;
Blake2.hashString = hashString;

export default Blake2;
