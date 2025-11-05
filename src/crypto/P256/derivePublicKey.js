// @ts-nocheck
import { p256 } from "@noble/curves/nist.js";
import { PRIVATE_KEY_SIZE } from "./constants.js";
import { InvalidPrivateKeyError } from "./errors.js";

/**
 * Derive public key from private key
 *
 * @param {import('./BrandedP256PrivateKey.js').BrandedP256PrivateKey} privateKey - 32-byte private key
 * @returns {import('./BrandedP256PublicKey.js').BrandedP256PublicKey} 64-byte uncompressed public key (x || y coordinates)
 * @throws {InvalidPrivateKeyError} If private key is invalid
 *
 * @example
 * ```typescript
 * const privateKey = new Uint8Array(32);
 * const publicKey = P256.derivePublicKey(privateKey);
 * ```
 */
export function derivePublicKey(privateKey) {
	if (privateKey.length !== PRIVATE_KEY_SIZE) {
		throw new InvalidPrivateKeyError(
			`Private key must be ${PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`,
		);
	}

	try {
		const pubKey = p256.getPublicKey(privateKey, false);
		// Remove 0x04 prefix for uncompressed format
		return pubKey.slice(1);
	} catch (error) {
		throw new InvalidPrivateKeyError(`Failed to derive public key: ${error}`);
	}
}
