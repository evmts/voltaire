import { ripemd160 as nobleRipemd160 } from "@noble/hashes/legacy.js";
import { parseHexByte } from "../../primitives/Hex/parseHexByte.js";

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
		bytes[i] = parseHexByte(normalized, i * 2);
	}
	return /** @type {import('./Ripemd160HashType.js').Ripemd160Hash} */ (
		nobleRipemd160(bytes)
	);
}
