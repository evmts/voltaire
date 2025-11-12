// @ts-nocheck
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { InvalidPrivateKeyError } from "../../primitives/errors/index.js";

/**
 * Derive public key from private key
 *
 * Computes the public key point from a private key using scalar
 * multiplication on the secp256k1 curve.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('../../primitives/PrivateKey/BrandedPrivateKey/BrandedPrivateKey.js').BrandedPrivateKey} privateKey - 32-byte private key
 * @returns {import('./BrandedSecp256k1PublicKey.js').BrandedSecp256k1PublicKey} 64-byte uncompressed public key
 * @throws {InvalidPrivateKeyError} If private key is invalid
 * @example
 * ```javascript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * import * as PrivateKey from './primitives/PrivateKey/index.js';
 * const privateKey = PrivateKey.from(new Uint8Array(32));
 * const publicKey = Secp256k1.derivePublicKey(privateKey);
 * console.log(publicKey.length); // 64
 * ```
 */
export function derivePublicKey(privateKey) {
	try {
		// Get public key from private key (uncompressed, 65 bytes with 0x04 prefix)
		const uncompressed = secp256k1.getPublicKey(privateKey, false);

		if (uncompressed[0] !== 0x04) {
			throw new InvalidPrivateKeyError("Invalid public key format", {
				code: "INVALID_PUBLIC_KEY_FORMAT",
				context: { prefix: uncompressed[0], expected: 0x04 },
				docsPath: "/crypto/secp256k1/derive-public-key#error-handling",
			});
		}

		// Return 64 bytes without the 0x04 prefix
		return /** @type {import('./BrandedSecp256k1PublicKey.js').BrandedSecp256k1PublicKey} */ (
			uncompressed.slice(1)
		);
	} catch (error) {
		throw new InvalidPrivateKeyError(`Key derivation failed: ${error}`, {
			code: "KEY_DERIVATION_FAILED",
			context: { privateKeyLength: privateKey.length },
			docsPath: "/crypto/secp256k1/derive-public-key#error-handling",
			cause: error,
		});
	}
}
