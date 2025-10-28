/**
 * BLAKE2b Hash Function
 *
 * BLAKE2 is a cryptographic hash function faster than MD5, SHA-1, SHA-2, and SHA-3,
 * yet is at least as secure as the latest standard SHA-3.
 * BLAKE2b is optimized for 64-bit platforms and produces digests of any size between 1 and 64 bytes.
 *
 * @example
 * ```typescript
 * import { Blake2 } from './blake2.js';
 *
 * // Hash data with default 64-byte output
 * const hash = Blake2.hash(new Uint8Array([1, 2, 3]));
 *
 * // Hash string with custom 32-byte output
 * const hash32 = Blake2.hashString("hello", 32);
 * ```
 */

import { blake2b } from "@noble/hashes/blake2.js";

/**
 * BLAKE2b operations namespace
 */
export namespace Blake2 {
  /**
   * Hash data with BLAKE2b
   *
   * @param data - Input data to hash (Uint8Array or string)
   * @param outputLength - Output length in bytes (1-64, default 64)
   * @returns BLAKE2b hash
   * @throws {Error} If outputLength is invalid
   *
   * @example
   * ```typescript
   * const hash = Blake2.hash(new Uint8Array([1, 2, 3]));
   * const hash32 = Blake2.hash("hello", 32);
   * ```
   */
  export function hash(data: Uint8Array | string, outputLength = 64): Uint8Array {
    if (outputLength < 1 || outputLength > 64) {
      throw new Error(`Invalid output length: ${outputLength}. Must be between 1 and 64 bytes.`);
    }

    const input = typeof data === "string" ? new TextEncoder().encode(data) : data;
    return blake2b(input, { dkLen: outputLength });
  }

  /**
   * Hash string with BLAKE2b (convenience function)
   *
   * @param str - Input string to hash
   * @param outputLength - Output length in bytes (1-64, default 64)
   * @returns BLAKE2b hash
   * @throws {Error} If outputLength is invalid
   *
   * @example
   * ```typescript
   * const hash = Blake2.hashString("hello world");
   * const hash48 = Blake2.hashString("hello world", 48);
   * ```
   */
  export function hashString(str: string, outputLength = 64): Uint8Array {
    return hash(str, outputLength);
  }
}

export default Blake2;
