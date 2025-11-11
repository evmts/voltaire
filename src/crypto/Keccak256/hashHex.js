import { hash } from "./hash.js";

/**
 * Hash hex string with Keccak-256
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} hex - Hex string to hash (with or without 0x prefix)
 * @returns {import('../../primitives/Hash/index.js').BrandedHash} 32-byte hash
 * @throws {Error} If hex string is invalid or has odd length
 * @example
 * ```javascript
 * import * as Keccak256 from './crypto/Keccak256/index.js';
 * const hash = Keccak256.hashHex('0x1234abcd');
 * ```
 */
export function hashHex(hex) {
	const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (!/^[0-9a-fA-F]*$/.test(normalized)) {
		throw new Error("Invalid hex string");
	}
	if (normalized.length % 2 !== 0) {
		throw new Error("Hex string must have even length");
	}
	const bytes = new Uint8Array(normalized.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
	}
	return hash(bytes);
}
