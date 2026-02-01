import { ed25519 } from "@noble/curves/ed25519.js";
import { SECRET_KEY_SIZE } from "./constants.js";
import { InvalidSecretKeyError } from "./errors.js";

/**
 * Derive Ed25519 public key from secret key.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./SecretKey.js').SecretKey} secretKey - 32-byte Ed25519 secret key (seed)
 * @returns {import('./PublicKey.js').PublicKey} 32-byte Ed25519 public key
 * @throws {InvalidSecretKeyError} If secret key length is invalid or derivation fails
 * @example
 * ```javascript
 * import * as Ed25519 from './crypto/Ed25519/index.js';
 * const secretKey = new Uint8Array(32); // Your secret key
 * const publicKey = Ed25519.derivePublicKey(secretKey);
 * ```
 */
export function derivePublicKey(secretKey) {
	if (secretKey.length !== SECRET_KEY_SIZE) {
		throw new InvalidSecretKeyError(
			`Secret key must be ${SECRET_KEY_SIZE} bytes, got ${secretKey.length}`,
		);
	}

	try {
		return ed25519.getPublicKey(secretKey);
	} catch (error) {
		throw new InvalidSecretKeyError(`Failed to derive public key: ${error}`);
	}
}
