import { sha256 as nobleSha256 } from "@noble/hashes/sha2.js";

/**
 * Compute SHA256 hash of UTF-8 string
 *
 * @param {string} str - Input string
 * @returns {Uint8Array} 32-byte hash
 *
 * @example
 * ```typescript
 * const hash = SHA256.hashString("hello world");
 * // Uint8Array(32) [0xb9, 0x4d, 0x27, ...]
 * ```
 */
export function hashString(str) {
	const encoder = new TextEncoder();
	const data = encoder.encode(str);
	return nobleSha256(data);
}
