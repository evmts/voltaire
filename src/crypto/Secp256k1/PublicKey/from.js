// @ts-nocheck
import { isValidPublicKey } from "../isValidPublicKey.js";
import { fromBytes } from "./fromBytes.js";

/**
 * Create a BrandedSecp256k1PublicKey from various input formats
 *
 * Accepts either a Uint8Array (raw bytes) or hex string.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array | string} input - Public key as raw bytes or hex string (with or without 0x prefix)
 * @returns {import('../BrandedSecp256k1PublicKey.js').BrandedSecp256k1PublicKey} Branded public key
 * @throws {Error} If input format or public key is invalid
 * @example
 * ```javascript
 * import * as PublicKey from './crypto/Secp256k1/PublicKey/index.js';
 * // From bytes
 * const pk1 = PublicKey.from(keyBytes);
 * // From hex string
 * const pk2 = PublicKey.from("0x1234...");
 * ```
 */
export function from(input) {
	if (typeof input === "string") {
		// Convert hex string to bytes
		const hexStr = input.startsWith("0x") ? input.slice(2) : input;
		if (!/^[0-9a-fA-F]+$/.test(hexStr)) {
			throw new Error(`Invalid hex string: ${input}`);
		}
		if (hexStr.length !== 128) {
			throw new Error(
				`Invalid public key hex length: expected 128 characters (64 bytes), got ${hexStr.length}`,
			);
		}
		const bytes = new Uint8Array(64);
		for (let i = 0; i < 64; i++) {
			bytes[i] = Number.parseInt(hexStr.slice(i * 2, i * 2 + 2), 16);
		}
		return fromBytes(bytes);
	}

	// Assume it's a Uint8Array
	return fromBytes(input);
}
