import { x25519 } from "@noble/curves/ed25519.js";
import { constantTimeIsZero } from "../ConstantTime/constantTimeIsZero.js";
import { PUBLIC_KEY_SIZE, SECRET_KEY_SIZE } from "./constants.js";
import {
	InvalidPublicKeyError,
	InvalidSecretKeyError,
	X25519Error,
} from "./errors.js";
import { isWeakPublicKey } from "./isWeakPublicKey.js";

/**
 * Perform X25519 scalar multiplication (ECDH)
 *
 * Computes shared secret from your secret key and their public key.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./SecretKey.js').SecretKey} secretKey - Your 32-byte secret key
 * @param {import('./PublicKey.js').PublicKey} publicKey - Their 32-byte public key
 * @returns {import('./SharedSecret.js').SharedSecret} 32-byte shared secret
 * @throws {InvalidSecretKeyError} If secret key is invalid
 * @throws {InvalidPublicKeyError} If public key has the wrong length, is a low-order point, or yields an all-zero shared secret (RFC 7748 section 6.1)
 * @throws {X25519Error} If scalar multiplication fails
 * @example
 * ```javascript
 * import { X25519 } from './crypto/X25519/index.js';
 * const mySecret = crypto.getRandomValues(new Uint8Array(32));
 * const theirPublic = X25519.derivePublicKey(theirSecret);
 * const shared = X25519.scalarmult(mySecret, theirPublic);
 * console.log(shared.length); // 32
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

	if (isWeakPublicKey(publicKey)) {
		throw new InvalidPublicKeyError(
			"Public key is a low-order point (all-zero shared secret)",
		);
	}

	/** @type {Uint8Array} */
	let shared;
	try {
		shared = x25519.getSharedSecret(secretKey, publicKey);
	} catch (error) {
		throw new X25519Error(`Scalar multiplication failed: ${error}`);
	}

	// RFC 7748 section 6.1: abort on an all-zero shared secret. Checked in
	// constant time and independently of the low-order list above.
	if (constantTimeIsZero(shared)) {
		throw new InvalidPublicKeyError(
			"Shared secret is all zeros (low-order public key)",
		);
	}

	return shared;
}
