import { ed25519 } from "@noble/curves/ed25519.js";
import { InvalidSecretKeyError, Ed25519Error } from "./errors.js";
import { SECRET_KEY_SIZE } from "./constants.js";

/**
 * Sign a message with Ed25519 secret key
 *
 * @param {Uint8Array} message - Message to sign (any length)
 * @param {import('./SecretKey.js').SecretKey} secretKey - 32-byte secret key (seed)
 * @returns {import('./Signature.js').Signature} 64-byte signature
 * @throws {InvalidSecretKeyError} If secret key is invalid
 *
 * @example
 * ```typescript
 * const message = new TextEncoder().encode('Hello!');
 * const signature = Ed25519.sign(message, secretKey);
 * ```
 */
export function sign(message, secretKey) {
	if (secretKey.length !== SECRET_KEY_SIZE) {
		throw new InvalidSecretKeyError(
			`Secret key must be ${SECRET_KEY_SIZE} bytes, got ${secretKey.length}`,
		);
	}

	try {
		return ed25519.sign(message, secretKey);
	} catch (error) {
		throw new Ed25519Error(`Signing failed: ${error}`);
	}
}
