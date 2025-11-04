import { ed25519 } from "@noble/curves/ed25519.js";
import { PUBLIC_KEY_SIZE } from "./constants.js";

/**
 * Validate a public key
 *
 * Checks if the public key is valid
 *
 * @param {import('./PublicKey.js').PublicKey} publicKey - Public key to validate
 * @returns {boolean} True if valid, false otherwise
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
