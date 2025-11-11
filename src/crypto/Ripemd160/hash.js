// @ts-nocheck
import { ripemd160 as nobleRipemd160 } from "@noble/hashes/legacy.js";

/**
 * Compute RIPEMD160 hash (20 bytes)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array | string} data - Input data (Uint8Array or string)
 * @returns {Uint8Array} 20-byte hash
 * @throws {never}
 * @example
 * ```javascript
 * import { Ripemd160 } from './crypto/Ripemd160/index.js';
 * const hash = Ripemd160.hash(new Uint8Array([1, 2, 3]));
 * console.log(hash.length); // 20
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
