// @ts-nocheck
import { p256 } from "@noble/curves/nist.js";
import { PRIVATE_KEY_SIZE } from "./constants.js";

/**
 * Validate a private key
 *
 * Checks if the private key is in the valid range [1, n-1]
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./BrandedP256PrivateKey.js').BrandedP256PrivateKey} privateKey - Private key to validate
 * @returns {boolean} True if valid, false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as P256 from './crypto/P256/index.js';
 * const privateKey = new Uint8Array(32);
 * const isValid = P256.validatePrivateKey(privateKey);
 * ```
 */
export function validatePrivateKey(privateKey) {
	if (privateKey.length !== PRIVATE_KEY_SIZE) {
		return false;
	}

	try {
		// Try to derive public key - will fail if invalid
		p256.getPublicKey(privateKey, false);
		return true;
	} catch {
		return false;
	}
}
