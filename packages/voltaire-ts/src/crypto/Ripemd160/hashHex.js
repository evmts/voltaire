// @ts-nocheck
import { ripemd160 as nobleRipemd160 } from "@noble/hashes/legacy.js";

/**
 * Compute RIPEMD160 hash of hex string (without 0x prefix)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {import('./Ripemd160HashType.js').Ripemd160Hash} 20-byte hash
 * @throws {never}
 * @example
 * ```javascript
 * import { Ripemd160 } from './crypto/Ripemd160/index.js';
 * const hash = Ripemd160.hashHex("0xdeadbeef");
 * console.log(hash.length); // 20
 * ```
 */
export function hashHex(hex) {
	const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(normalized.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
	}
	return nobleRipemd160(bytes);
}
