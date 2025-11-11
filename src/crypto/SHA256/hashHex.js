import { sha256 as nobleSha256 } from "@noble/hashes/sha2.js";

/**
 * Compute SHA256 hash of hex string (without 0x prefix)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {Uint8Array} 32-byte hash
 * @throws {never}
 * @example
 * ```javascript
 * import { SHA256 } from './crypto/SHA256/index.js';
 * const hash = SHA256.hashHex("0xdeadbeef");
 * console.log(hash.length); // 32
 * ```
 */
export function hashHex(hex) {
	const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(normalized.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
	}
	return nobleSha256(bytes);
}
