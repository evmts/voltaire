import { hash } from "./hash.js";
import { hashString } from "./hashString.js";

/**
 * Hash input with BLAKE2b (constructor pattern)
 *
 * Auto-detects input type and hashes accordingly:
 * - Uint8Array: hash directly
 * - string: UTF-8 encode then hash
 *
 * @see https://voltaire.tevm.sh/crypto/blake2 for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array | string} input - Data to hash
 * @param {number} [outputLength=64] - Output length in bytes (1-64, default 64)
 * @returns {import('./Blake2HashType.js').Blake2Hash} BLAKE2b hash
 * @throws {Error} If outputLength is invalid
 * @example
 * ```javascript
 * import { Blake2Hash } from './crypto/Blake2/index.js';
 *
 * const hash1 = Blake2Hash.from("hello");              // String, 64 bytes
 * const hash2 = Blake2Hash.from("hello", 32);          // String, 32 bytes
 * const hash3 = Blake2Hash.from(uint8array);           // Bytes, 64 bytes
 * const hash4 = Blake2Hash.from(uint8array, 48);       // Bytes, 48 bytes
 * ```
 */
export function from(input, outputLength = 64) {
	if (input instanceof Uint8Array) {
		return hash(input, outputLength);
	}
	if (typeof input === "string") {
		return hashString(input, outputLength);
	}
	throw new TypeError(
		`Invalid input type. Expected Uint8Array or string, got ${typeof input}`,
	);
}
