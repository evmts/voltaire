// @ts-nocheck
import { hash } from "./hash.js";
import { hashString } from "./hashString.js";

// Export individual functions
export { hash, hashString };

/**
 * BLAKE2b Hash Function
 *
 * BLAKE2 is a cryptographic hash function faster than MD5, SHA-1, SHA-2, and SHA-3,
 * yet is at least as secure as the latest standard SHA-3.
 * BLAKE2b is optimized for 64-bit platforms and produces digests of any size between 1 and 64 bytes.
 *
 * @example
 * ```typescript
 * import { Blake2 } from './Blake2.js';
 *
 * // Hash data with default 64-byte output
 * const hash = Blake2.hash(new Uint8Array([1, 2, 3]));
 *
 * // Hash string with custom 32-byte output
 * const hash32 = Blake2.hashString("hello", 32);
 * ```
 */
export const Blake2 = {
	hash,
	hashString,
};

export default Blake2;
