import { sha256 as nobleSha256 } from "@noble/hashes/sha2.js";

/**
 * Compute SHA256 hash of input data
 *
 * @param {Uint8Array} data - Input data as Uint8Array
 * @returns {Uint8Array} 32-byte hash
 *
 * @example
 * ```typescript
 * const hash = SHA256.hash(new Uint8Array([1, 2, 3]));
 * // Uint8Array(32) [...]
 * ```
 */
export function hash(data) {
	return nobleSha256(data);
}
