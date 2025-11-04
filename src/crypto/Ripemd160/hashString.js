// @ts-nocheck
import { ripemd160 as nobleRipemd160 } from "@noble/hashes/legacy.js";

/**
 * Compute RIPEMD160 hash of UTF-8 string
 *
 * @param {string} str - Input string
 * @returns {Uint8Array} 20-byte hash
 *
 * @example
 * ```typescript
 * const hash = Ripemd160.hashString("hello");
 * // Uint8Array(20)
 * ```
 */
export function hashString(str) {
	const encoder = new TextEncoder();
	const bytes = encoder.encode(str);
	return nobleRipemd160(bytes);
}
