import { hash } from "./hash.js";

/**
 * Hash hex string with Keccak-256
 *
 * @param {string} hex - Hex string to hash (with or without 0x prefix)
 * @returns {import('../../primitives/Hash/index.js').BrandedHash} 32-byte hash
 * @throws {Error} If hex string is invalid or has odd length
 *
 * @example
 * ```typescript
 * const hash = Keccak256.hashHex('0x1234...');
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
