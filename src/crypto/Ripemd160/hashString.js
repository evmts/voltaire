// @ts-nocheck
import { ripemd160 as nobleRipemd160 } from "@noble/hashes/legacy.js";

/**
 * Compute RIPEMD160 hash of UTF-8 string
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} str - Input string
 * @returns {Uint8Array} 20-byte hash
 * @throws {never}
 * @example
 * ```javascript
 * import { Ripemd160 } from './crypto/Ripemd160/index.js';
 * const hash = Ripemd160.hashString("hello");
 * console.log(hash.length); // 20
 * ```
 */
export function hashString(str) {
	const encoder = new TextEncoder();
	const bytes = encoder.encode(str);
	return nobleRipemd160(bytes);
}
