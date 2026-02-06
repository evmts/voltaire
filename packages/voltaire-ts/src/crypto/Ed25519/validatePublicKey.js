import { ed25519 } from "@noble/curves/ed25519.js";
import { PUBLIC_KEY_SIZE } from "./constants.js";

/**
 * Validate Ed25519 public key format and curve membership.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./PublicKey.js').PublicKey} publicKey - Ed25519 public key to validate
 * @returns {boolean} True if public key is valid and on curve, false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as Ed25519 from './crypto/Ed25519/index.js';
 * const isValid = Ed25519.validatePublicKey(publicKey);
 * if (!isValid) console.log('Invalid public key');
 * ```
 */
export function validatePublicKey(publicKey) {
	if (publicKey.length !== PUBLIC_KEY_SIZE) {
		return false;
	}

	try {
		// Try to verify with a dummy signature - will fail if invalid key
		const dummySig = new Uint8Array(64);
		const dummyMsg = new Uint8Array(1);
		ed25519.verify(dummySig, dummyMsg, publicKey);
		return true;
	} catch {
		return false;
	}
}
