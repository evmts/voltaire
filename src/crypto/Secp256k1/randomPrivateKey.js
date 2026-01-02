import { PRIVATE_KEY_SIZE } from "./constants.js";
import { isValidPrivateKey } from "./isValidPrivateKey.js";

/**
 * Generate a cryptographically secure random secp256k1 private key
 *
 * @returns {Uint8Array} 32-byte private key
 *
 * @example
 * ```javascript
 * import { Secp256k1 } from './crypto/Secp256k1/index.js';
 * const privateKey = Secp256k1.randomPrivateKey();
 * const publicKey = Secp256k1.derivePublicKey(privateKey);
 * ```
 */
export function randomPrivateKey() {
	// Generate random bytes until we get a valid private key
	// A valid secp256k1 private key is 1 <= key < CURVE_ORDER
	const bytes = new Uint8Array(PRIVATE_KEY_SIZE);

	// Use crypto.getRandomValues for secure randomness
	if (
		typeof globalThis.crypto !== "undefined" &&
		globalThis.crypto.getRandomValues
	) {
		// Try up to 100 times to find a valid key (should almost always succeed first try)
		for (let i = 0; i < 100; i++) {
			globalThis.crypto.getRandomValues(bytes);
			if (isValidPrivateKey(bytes)) {
				return bytes;
			}
		}
		throw new Error("Failed to generate valid private key after 100 attempts");
	}

	throw new Error(
		"crypto.getRandomValues not available - cannot generate secure private key",
	);
}
