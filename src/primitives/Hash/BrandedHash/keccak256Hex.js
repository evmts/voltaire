import { InvalidFormatError } from "../../errors/ValidationError.js";
import { keccak256 } from "./keccak256.js";

/**
 * Hash hex string with Keccak-256
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {string} hex - Hex string to hash (with or without 0x prefix)
 * @returns {import('./BrandedHash.js').BrandedHash} 32-byte hash
 * @throws {InvalidFormatError} If hex string has odd length
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * const hash = Hash.keccak256Hex('0x1234...');
 * ```
 */
export function keccak256Hex(hex) {
	const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (normalized.length % 2 !== 0) {
		throw new InvalidFormatError("Hex string must have even length", {
			code: "HASH_ODD_HEX_LENGTH",
			value: hex,
			expected: "even-length hex string",
			context: { length: normalized.length },
			docsPath: "/primitives/hash",
		});
	}
	const bytes = new Uint8Array(normalized.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
	}
	return keccak256(bytes);
}
