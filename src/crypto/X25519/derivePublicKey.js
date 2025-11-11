import { x25519 } from "@noble/curves/ed25519.js";
import { SECRET_KEY_SIZE } from "./constants.js";
import { InvalidSecretKeyError } from "./errors.js";

/**
 * Derive public key from secret key
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./SecretKey.js').SecretKey} secretKey - 32-byte secret key
 * @returns {import('./PublicKey.js').PublicKey} 32-byte public key
 * @throws {InvalidSecretKeyError} If secret key is invalid
 * @example
 * ```javascript
 * import { X25519 } from './crypto/X25519/index.js';
 * const secretKey = crypto.getRandomValues(new Uint8Array(32));
 * const publicKey = X25519.derivePublicKey(secretKey);
 * console.log(publicKey.length); // 32
 * ```
 */
export function derivePublicKey(secretKey) {
	if (secretKey.length !== SECRET_KEY_SIZE) {
		throw new InvalidSecretKeyError(
			`Secret key must be ${SECRET_KEY_SIZE} bytes, got ${secretKey.length}`,
		);
	}

	try {
		return x25519.getPublicKey(secretKey);
	} catch (error) {
		throw new InvalidSecretKeyError(`Failed to derive public key: ${error}`);
	}
}
