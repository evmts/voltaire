import { InvalidFormatError } from "../../primitives/errors/ValidationError.js";
import { hash } from "./hash.js";

/**
 * Hash hex string with Keccak-256
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} hex - Hex string to hash (with or without 0x prefix)
 * @returns {import('../../primitives/Hash/index.js').BrandedHash} 32-byte hash
 * @throws {InvalidFormatError} If hex string is invalid or has odd length
 * @example
 * ```javascript
 * import * as Keccak256 from './crypto/Keccak256/index.js';
 * const hash = Keccak256.hashHex('0x1234abcd');
 * ```
 */
export function hashHex(hex) {
	const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (!/^[0-9a-fA-F]*$/.test(normalized)) {
		throw new InvalidFormatError("Invalid hex string", {
			code: "KECCAK256_INVALID_HEX",
			value: hex,
			expected: "Hex string (0-9, a-f, A-F)",
			docsPath: "/crypto/keccak256/hash-hex#error-handling",
		});
	}
	if (normalized.length % 2 !== 0) {
		throw new InvalidFormatError("Hex string must have even length", {
			code: "KECCAK256_ODD_HEX_LENGTH",
			value: hex,
			expected: "Even number of hex characters",
			docsPath: "/crypto/keccak256/hash-hex#error-handling",
		});
	}
	const bytes = new Uint8Array(normalized.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
	}
	return hash(bytes);
}
