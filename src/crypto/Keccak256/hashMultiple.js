import { hash } from "./hash.js";

/**
 * Hash multiple data chunks in sequence
 *
 * Equivalent to hashing the concatenation of all chunks.
 *
 * @param {readonly Uint8Array[]} chunks - Array of data chunks to hash
 * @returns {import('../../primitives/Hash/index.js').BrandedHash} 32-byte hash
 *
 * @example
 * ```typescript
 * const hash = Keccak256.hashMultiple([data1, data2, data3]);
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
