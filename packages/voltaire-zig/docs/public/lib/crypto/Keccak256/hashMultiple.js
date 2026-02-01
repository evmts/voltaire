import { hash } from "./hash.js";

/**
 * Hash multiple data chunks in sequence
 *
 * Equivalent to hashing the concatenation of all chunks.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {readonly Uint8Array[]} chunks - Array of data chunks to hash
 * @returns {import('./Keccak256HashType.js').Keccak256Hash} 32-byte hash
 * @throws {never}
 * @example
 * ```javascript
 * import { Keccak256Hash } from './crypto/Keccak256/index.js';
 * const hash = Keccak256Hash.from(combined);
 * ```
 */
export function hashMultiple(chunks) {
	const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
	const combined = new Uint8Array(totalLength);
	let offset = 0;
	for (const chunk of chunks) {
		combined.set(chunk, offset);
		offset += chunk.length;
	}
	return hash(combined);
}
