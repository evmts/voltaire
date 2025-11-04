import { hash } from "./hash.js";

/**
 * Hash string with BLAKE2b (convenience function)
 *
 * @param {string} str - Input string to hash
 * @param {number} [outputLength=64] - Output length in bytes (1-64, default 64)
 * @returns {Uint8Array} BLAKE2b hash
 * @throws {Error} If outputLength is invalid
 *
 * @example
 * ```typescript
 * const hash = Blake2.hashString("hello world");
 * const hash48 = Blake2.hashString("hello world", 48);
 * ```
 */
export function hashString(str, outputLength = 64) {
	return hash(str, outputLength);
}
