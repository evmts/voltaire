import { PUBLIC_KEY_SIZE } from "./constants.js";

/**
 * Validate a public key
 *
 * Checks if the public key has correct length
 *
 * @param {import('./PublicKey.js').PublicKey} publicKey - Public key to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function validatePublicKey(publicKey) {
	if (publicKey.length !== PUBLIC_KEY_SIZE) {
		return false;
	}

	// Basic validation - should not be all zeros
	return publicKey.some((b) => b !== 0);
}
