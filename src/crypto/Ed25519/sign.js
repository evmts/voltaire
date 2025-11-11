import { ed25519 } from "@noble/curves/ed25519.js";
import { SECRET_KEY_SIZE } from "./constants.js";
import { Ed25519Error, InvalidSecretKeyError } from "./errors.js";

/**
 * Sign message with Ed25519 secret key.
 *
 * Produces deterministic signatures using EdDSA.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} message - Message bytes to sign (any length)
 * @param {import('./SecretKey.js').SecretKey} secretKey - 32-byte Ed25519 secret key
 * @returns {import('./Signature.js').Signature} 64-byte Ed25519 signature
 * @throws {InvalidSecretKeyError} If secret key length is not 32 bytes
 * @throws {Ed25519Error} If signing operation fails
 * @example
 * ```javascript
 * import * as Ed25519 from './crypto/Ed25519/index.js';
 * const message = new TextEncoder().encode('Hello, world!');
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
