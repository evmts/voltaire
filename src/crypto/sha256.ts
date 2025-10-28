/**
 * SHA256 Cryptographic Hash Function
 *
 * Complete SHA256 implementation using @noble/hashes with data-first API.
 * All operations are namespaced under Sha256.
 *
 * @example
 * ```typescript
 * import { Sha256 } from './sha256.js';
 *
 * // Hash bytes
 * const hash = Sha256.hash(new Uint8Array([1, 2, 3]));
 *
 * // Hash string
 * const hash2 = Sha256.hashString("hello world");
 * ```
 */

import { sha256 as nobleSha256 } from "@noble/hashes/sha256";

// ============================================================================
// Core Namespace
// ============================================================================

export namespace Sha256 {
  /**
   * SHA256 output size in bytes (256 bits / 8)
   */
  export const OUTPUT_SIZE = 32;

  /**
   * SHA256 block size in bytes
   */
  export const BLOCK_SIZE = 64;

  /**
   * Compute SHA256 hash of input data
   *
   * @param data - Input data as Uint8Array
   * @returns 32-byte hash
   *
   * @example
   * ```typescript
   * const hash = Sha256.hash(new Uint8Array([1, 2, 3]));
   * // Uint8Array(32) [...]
   * ```
   */
  export function hash(data: Uint8Array): Uint8Array {
    return nobleSha256(data);
  }

  /**
   * Compute SHA256 hash of UTF-8 string
   *
   * @param str - Input string
   * @returns 32-byte hash
   *
   * @example
   * ```typescript
   * const hash = Sha256.hashString("hello world");
   * // Uint8Array(32) [0xb9, 0x4d, 0x27, ...]
   * ```
   */
  export function hashString(str: string): Uint8Array {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    return nobleSha256(data);
  }

  /**
   * Compute SHA256 hash of hex string (without 0x prefix)
   *
   * @param hex - Hex string (with or without 0x prefix)
   * @returns 32-byte hash
   *
   * @example
   * ```typescript
   * const hash = Sha256.hashHex("0xdeadbeef");
   * // Uint8Array(32) [...]
   * ```
   */
  export function hashHex(hex: string): Uint8Array {
    const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
    const bytes = new Uint8Array(normalized.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
    }
    return nobleSha256(bytes);
  }

  /**
   * Convert hash output to hex string
   *
   * @param hash - Hash bytes
   * @returns Hex string with 0x prefix
   *
   * @example
   * ```typescript
   * const hash = Sha256.hash(data);
   * const hexStr = Sha256.toHex(hash);
   * // "0x..."
   * ```
   */
  export function toHex(hash: Uint8Array): string {
    return `0x${Array.from(hash)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")}`;
  }

  /**
   * Incremental hasher for streaming data
   *
   * @example
   * ```typescript
   * const hasher = Sha256.create();
   * hasher.update(chunk1);
   * hasher.update(chunk2);
   * const hash = hasher.digest();
   * ```
   */
  export function create() {
    const hasher = nobleSha256.create();
    return {
      /**
       * Update hasher with new data
       */
      update(data: Uint8Array): void {
        hasher.update(data);
      },
      /**
       * Finalize and get hash
       */
      digest(): Uint8Array {
        return hasher.digest();
      },
    };
  }
}

// Re-export as default
export default Sha256;
