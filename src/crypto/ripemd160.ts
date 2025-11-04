/**
 * RIPEMD160 Hash Function
 *
 * Legacy hash function used primarily in Bitcoin for address generation.
 * RIPEMD160 produces 20-byte (160-bit) hashes.
 *
 * @example
 * ```typescript
 * import { Ripemd160 } from './ripemd160.js';
 *
 * // Hash bytes
 * const hash = Ripemd160.hash(data);
 *
 * // Hash string
 * const hash2 = Ripemd160.hashString("hello");
 * ```
 */

import { ripemd160 as nobleRipemd160 } from "@noble/hashes/legacy.js";

// ============================================================================
// Ripemd160 Namespace
// ============================================================================

export namespace Ripemd160 {
	/**
	 * Compute RIPEMD160 hash (20 bytes)
	 *
	 * @param data - Input data (Uint8Array or string)
	 * @returns 20-byte hash
	 *
	 * @example
	 * ```typescript
	 * const hash = Ripemd160.hash(data);
	 * // Uint8Array(20)
	 * ```
	 */
	export function hash(data: Uint8Array | string): Uint8Array {
		if (typeof data === "string") {
			return hashString(data);
		}
		return nobleRipemd160(data);
	}

	/**
	 * Compute RIPEMD160 hash of UTF-8 string
	 *
	 * @param str - Input string
	 * @returns 20-byte hash
	 *
	 * @example
	 * ```typescript
	 * const hash = Ripemd160.hashString("hello");
	 * // Uint8Array(20)
	 * ```
	 */
	export function hashString(str: string): Uint8Array {
		const encoder = new TextEncoder();
		const bytes = encoder.encode(str);
		return nobleRipemd160(bytes);
	}
}

// Re-export namespace as default
export default Ripemd160;
