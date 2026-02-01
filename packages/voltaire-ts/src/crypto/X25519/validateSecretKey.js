import { x25519 } from "@noble/curves/ed25519.js";
import { SECRET_KEY_SIZE } from "./constants.js";

/**
 * Validate a secret key
 *
 * Checks if the secret key has correct length and can derive a public key
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./SecretKey.js').SecretKey} secretKey - Secret key to validate
 * @returns {boolean} True if valid, false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import { X25519 } from './crypto/X25519/index.js';
 * const secretKey = new Uint8Array(32);
 * const valid = X25519.validateSecretKey(secretKey);
 * ```
 */
export function validateSecretKey(secretKey) {
	if (secretKey.length !== SECRET_KEY_SIZE) {
		return false;
	}

	try {
		// Try to derive public key - will fail if invalid
		x25519.getPublicKey(secretKey);
		return true;
	} catch {
		return false;
	}
}
