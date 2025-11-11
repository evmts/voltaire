import { ed25519 } from "@noble/curves/ed25519.js";
import { PUBLIC_KEY_SIZE, SIGNATURE_SIZE } from "./constants.js";
import { InvalidPublicKeyError, InvalidSignatureError } from "./errors.js";

/**
 * Verify Ed25519 signature.
 *
 * Returns false on verification failure instead of throwing.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./Signature.js').Signature} signature - 64-byte Ed25519 signature to verify
 * @param {Uint8Array} message - Original message bytes that were signed
 * @param {import('./PublicKey.js').PublicKey} publicKey - 32-byte Ed25519 public key
 * @returns {boolean} True if signature is cryptographically valid, false otherwise
 * @throws {InvalidPublicKeyError} If public key length is not 32 bytes
 * @throws {InvalidSignatureError} If signature length is not 64 bytes
 * @example
 * ```javascript
 * import * as Ed25519 from './crypto/Ed25519/index.js';
 * const valid = Ed25519.verify(signature, message, publicKey);
 * if (valid) console.log('Signature verified');
 * ```
 */
export function verify(signature, message, publicKey) {
	if (publicKey.length !== PUBLIC_KEY_SIZE) {
		throw new InvalidPublicKeyError(
			`Public key must be ${PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`,
		);
	}

	if (signature.length !== SIGNATURE_SIZE) {
		throw new InvalidSignatureError(
			`Signature must be ${SIGNATURE_SIZE} bytes, got ${signature.length}`,
		);
	}

	try {
		return ed25519.verify(signature, message, publicKey);
	} catch {
		return false;
	}
}
