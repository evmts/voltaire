import { PRIVATE_KEY_SIZE } from "./constants.js";
import { P256Error } from "./errors.js";
import { validatePrivateKey } from "./validatePrivateKey.js";

/**
 * Generate a cryptographically secure random P256 private key
 *
 * @returns {Uint8Array} 32-byte private key
 * @throws {P256Error} If crypto.getRandomValues is not available or generation fails
 *
 * @example
 * ```javascript
 * import { P256 } from './crypto/P256/index.js';
 * const privateKey = P256.randomPrivateKey();
 * const publicKey = P256.derivePublicKey(privateKey);
 * ```
 */
export function randomPrivateKey() {
	// Generate random bytes until we get a valid private key
	// A valid P256 private key is 1 <= key < CURVE_ORDER
	const bytes = new Uint8Array(PRIVATE_KEY_SIZE);

	// Use crypto.getRandomValues for secure randomness
	if (
		typeof globalThis.crypto !== "undefined" &&
		globalThis.crypto.getRandomValues
	) {
		// Try up to 100 times to find a valid key (should almost always succeed first try)
		for (let i = 0; i < 100; i++) {
			globalThis.crypto.getRandomValues(bytes);
			if (validatePrivateKey(bytes)) {
				return bytes;
			}
		}
		throw new P256Error(
			"Failed to generate valid private key after 100 attempts",
			{
				code: -32000,
				context: { attempts: 100 },
				docsPath: "/crypto/p256/random-private-key#error-handling",
			},
		);
	}

	throw new P256Error(
		"crypto.getRandomValues not available - cannot generate secure private key",
		{
			code: -32000,
			docsPath: "/crypto/p256/random-private-key#error-handling",
		},
	);
}
