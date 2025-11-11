// @ts-nocheck
import { p256 } from "@noble/curves/nist.js";
import { PUBLIC_KEY_SIZE } from "./constants.js";

/**
 * Validate a public key
 *
 * Checks if the public key is a valid point on the P256 curve
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./BrandedP256PublicKey.js').BrandedP256PublicKey} publicKey - Public key to validate
 * @returns {boolean} True if valid, false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as P256 from './crypto/P256/index.js';
 * const publicKey = new Uint8Array(64);
 * const isValid = P256.validatePublicKey(publicKey);
 * ```
 */
export function validatePublicKey(publicKey) {
	if (publicKey.length !== PUBLIC_KEY_SIZE) {
		return false;
	}

	try {
		// Add 0x04 prefix for validation
		const fullPublicKey = new Uint8Array(65);
		fullPublicKey[0] = 0x04;
		fullPublicKey.set(publicKey, 1);

		// Try to verify with dummy sig - will fail if invalid key
		const dummySig = new Uint8Array(64);
		const dummyMsg = new Uint8Array(32);
		p256.verify(dummySig, dummyMsg, fullPublicKey);
		return true;
	} catch {
		return false;
	}
}
