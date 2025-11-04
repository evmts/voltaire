import { ed25519 } from "@noble/curves/ed25519.js";
import { InvalidPublicKeyError, InvalidSignatureError } from "./errors.js";
import { PUBLIC_KEY_SIZE, SIGNATURE_SIZE } from "./constants.js";

/**
 * Verify an Ed25519 signature
 *
 * @param {import('./Signature.js').Signature} signature - 64-byte signature to verify
 * @param {Uint8Array} message - Original message that was signed
 * @param {import('./PublicKey.js').PublicKey} publicKey - 32-byte public key
 * @returns {boolean} True if signature is valid, false otherwise
 * @throws {InvalidPublicKeyError} If public key format is invalid
 * @throws {InvalidSignatureError} If signature format is invalid
 *
 * @example
 * ```typescript
 * const valid = Ed25519.verify(signature, message, publicKey);
 * if (valid) console.log('Signature is valid!');
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
