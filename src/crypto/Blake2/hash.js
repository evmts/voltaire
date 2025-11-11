import { blake2b } from "@noble/hashes/blake2.js";

/**
 * Hash data with BLAKE2b
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array | string} data - Input data to hash (Uint8Array or string)
 * @param {number} [outputLength=64] - Output length in bytes (1-64, default 64)
 * @returns {Uint8Array} BLAKE2b hash
 * @throws {Error} If outputLength is invalid
 * @example
 * ```javascript
 * import * as Blake2 from './crypto/Blake2/index.js';
 * const hash = Blake2.hash(new Uint8Array([1, 2, 3]));
 * const hash32 = Blake2.hash("hello", 32);
 * ```
 */
export function hash(data, outputLength = 64) {
	if (outputLength < 1 || outputLength > 64) {
		throw new Error(
			`Invalid output length: ${outputLength}. Must be between 1 and 64 bytes.`,
		);
	}

	const input =
		typeof data === "string" ? new TextEncoder().encode(data) : data;
	return blake2b(input, { dkLen: outputLength });
}
