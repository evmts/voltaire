import { ed25519 } from "@noble/curves/ed25519.js";
import { SECRET_KEY_SIZE } from "./constants.js";
import { InvalidSecretKeyError } from "./errors.js";

/**
 * Derive public key from secret key
 *
 * @param {import('./SecretKey.js').SecretKey} secretKey - 32-byte secret key (seed)
 * @returns {import('./PublicKey.js').PublicKey} 32-byte public key
 * @throws {InvalidSecretKeyError} If secret key is invalid
 *
 * @example
 * ```typescript
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
