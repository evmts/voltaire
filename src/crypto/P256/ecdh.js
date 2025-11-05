// @ts-nocheck
import { p256 } from "@noble/curves/nist.js";
import { PRIVATE_KEY_SIZE, PUBLIC_KEY_SIZE } from "./constants.js";
import {
	InvalidPrivateKeyError,
	InvalidPublicKeyError,
	P256Error,
} from "./errors.js";

/**
 * Perform ECDH key exchange
 *
 * Computes shared secret from your private key and their public key.
 * Returns the x-coordinate of the shared point.
 *
 * @param {import('./BrandedP256PrivateKey.js').BrandedP256PrivateKey} privateKey - Your 32-byte private key
 * @param {import('./BrandedP256PublicKey.js').BrandedP256PublicKey} publicKey - Their 64-byte uncompressed public key
 * @returns {Uint8Array} 32-byte shared secret
 * @throws {InvalidPrivateKeyError} If private key is invalid
 * @throws {InvalidPublicKeyError} If public key is invalid
 *
 * @example
 * ```typescript
 * const myPrivateKey = new Uint8Array(32);
 * const theirPublicKey = P256.derivePublicKey(theirPrivateKey);
 * const sharedSecret = P256.ecdh(myPrivateKey, theirPublicKey);
 * ```
 */
export function ecdh(privateKey, publicKey) {
	if (privateKey.length !== PRIVATE_KEY_SIZE) {
		throw new InvalidPrivateKeyError(
			`Private key must be ${PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`,
		);
	}

	if (publicKey.length !== PUBLIC_KEY_SIZE) {
		throw new InvalidPublicKeyError(
			`Public key must be ${PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`,
		);
	}

	try {
		// Add 0x04 prefix for uncompressed public key
		const fullPublicKey = new Uint8Array(65);
		fullPublicKey[0] = 0x04;
		fullPublicKey.set(publicKey, 1);

		const shared = p256.getSharedSecret(privateKey, fullPublicKey);
		// Return x-coordinate only (standard ECDH)
		return shared.slice(1, 33);
	} catch (error) {
		throw new P256Error(`ECDH failed: ${error}`);
	}
}
