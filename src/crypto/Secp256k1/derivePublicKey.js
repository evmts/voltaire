// @ts-nocheck
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { InvalidPrivateKeyError } from "./errors.js";
import { PRIVATE_KEY_SIZE } from "./constants.js";

/**
 * Derive public key from private key
 *
 * Computes the public key point from a private key using scalar
 * multiplication on the secp256k1 curve.
 *
 * @param {Uint8Array} privateKey - 32-byte private key
 * @returns {Uint8Array} 64-byte uncompressed public key
 * @throws {InvalidPrivateKeyError} If private key is invalid
 *
 * @example
 * ```typescript
 * const privateKey = new Uint8Array(32); // Your key
 * const publicKey = Secp256k1.derivePublicKey(privateKey);
 * console.log(publicKey.length); // 64
 * ```
 */
export function derivePublicKey(privateKey) {
	if (privateKey.length !== PRIVATE_KEY_SIZE) {
		throw new InvalidPrivateKeyError(
			`Private key must be ${PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`,
		);
	}

	try {
		// Get public key from private key (uncompressed, 65 bytes with 0x04 prefix)
		const uncompressed = secp256k1.getPublicKey(privateKey, false);

		if (uncompressed[0] !== 0x04) {
			throw new InvalidPrivateKeyError("Invalid public key format");
		}

		// Return 64 bytes without the 0x04 prefix
		return uncompressed.slice(1);
	} catch (error) {
		throw new InvalidPrivateKeyError(`Key derivation failed: ${error}`);
	}
}
