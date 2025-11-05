import { x25519 } from "@noble/curves/ed25519.js";
import { PUBLIC_KEY_SIZE, SECRET_KEY_SIZE } from "./constants.js";
import {
	InvalidPublicKeyError,
	InvalidSecretKeyError,
	X25519Error,
} from "./errors.js";

/**
 * Perform X25519 scalar multiplication (ECDH)
 *
 * Computes shared secret from your secret key and their public key.
 *
 * @param {import('./SecretKey.js').SecretKey} secretKey - Your 32-byte secret key
 * @param {import('./PublicKey.js').PublicKey} publicKey - Their 32-byte public key
 * @returns {import('./SharedSecret.js').SharedSecret} 32-byte shared secret
 * @throws {InvalidSecretKeyError} If secret key is invalid
 * @throws {InvalidPublicKeyError} If public key is invalid
 *
 * @example
 * ```typescript
 * const mySecret = crypto.getRandomValues(new Uint8Array(32));
 * const theirPublic = X25519.derivePublicKey(theirSecret);
 * const shared = X25519.scalarmult(mySecret, theirPublic);
 * ```
 */
export function scalarmult(secretKey, publicKey) {
	if (secretKey.length !== SECRET_KEY_SIZE) {
		throw new InvalidSecretKeyError(
			`Secret key must be ${SECRET_KEY_SIZE} bytes, got ${secretKey.length}`,
		);
	}

	if (publicKey.length !== PUBLIC_KEY_SIZE) {
		throw new InvalidPublicKeyError(
			`Public key must be ${PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`,
		);
	}

	try {
		return x25519.getSharedSecret(secretKey, publicKey);
	} catch (error) {
		throw new X25519Error(`Scalar multiplication failed: ${error}`);
	}
}
