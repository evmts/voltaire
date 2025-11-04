// @ts-nocheck
import { ripemd160 as nobleRipemd160 } from "@noble/hashes/legacy.js";

/**
 * Compute RIPEMD160 hash (20 bytes)
 *
 * @param {Uint8Array | string} data - Input data (Uint8Array or string)
 * @returns {Uint8Array} 20-byte hash
 *
 * @example
 * ```typescript
 * const hash = Ripemd160.hash(data);
 * // Uint8Array(20)
 * ```
 */
export function hash(data) {
	if (typeof data === "string") {
		const encoder = new TextEncoder();
		const bytes = encoder.encode(data);
		return nobleRipemd160(bytes);
	}
	return nobleRipemd160(data);
}
