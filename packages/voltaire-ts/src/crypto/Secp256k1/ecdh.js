// @ts-nocheck
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { PRIVATE_KEY_SIZE, PUBLIC_KEY_SIZE } from "./constants.js";
import {
	InvalidPrivateKeyError,
	InvalidPublicKeyError,
	Secp256k1Error,
} from "./errors.js";

/**
 * Perform ECDH key exchange
 *
 * Computes shared secret from your private key and their public key.
 * Returns the x-coordinate of the shared point (32 bytes).
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @see https://eips.ethereum.org/EIPS/eip-5564 for ERC-5564 stealth addresses
 * @since 0.0.0
 * @param {import('../../primitives/PrivateKey/PrivateKeyType.js').PrivateKeyType} privateKey - Your 32-byte private key
 * @param {import('./Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} publicKey - Their 64-byte uncompressed public key
 * @returns {Uint8Array} 32-byte shared secret (x-coordinate)
 * @throws {InvalidPrivateKeyError} If private key is invalid
 * @throws {InvalidPublicKeyError} If public key is invalid
 * @throws {Secp256k1Error} If ECDH computation fails
 * @example
 * ```javascript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * const myPrivateKey = new Uint8Array(32);
 * const theirPublicKey = Secp256k1.derivePublicKey(theirPrivateKey);
 * const sharedSecret = Secp256k1.ecdh(myPrivateKey, theirPublicKey);
 * console.log(sharedSecret.length); // 32
 * ```
 */
export function ecdh(privateKey, publicKey) {
	if (privateKey.length !== PRIVATE_KEY_SIZE) {
		throw new InvalidPrivateKeyError(
			`Private key must be ${PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`,
			{
				code: "INVALID_PRIVATE_KEY_LENGTH",
				context: { actualLength: privateKey.length },
				docsPath: "/crypto/secp256k1/ecdh#error-handling",
			},
		);
	}

	if (publicKey.length !== PUBLIC_KEY_SIZE) {
		throw new InvalidPublicKeyError(
			`Public key must be ${PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`,
			{
				code: "INVALID_PUBLIC_KEY_LENGTH",
				context: { actualLength: publicKey.length },
				docsPath: "/crypto/secp256k1/ecdh#error-handling",
			},
		);
	}

	try {
		// Add 0x04 prefix for uncompressed public key
		const fullPublicKey = new Uint8Array(65);
		fullPublicKey[0] = 0x04;
		fullPublicKey.set(publicKey, 1);

		const shared = secp256k1.getSharedSecret(privateKey, fullPublicKey, false);
		// Return x-coordinate only (standard ECDH) - skip 0x04 prefix, take next 32 bytes
		return shared.slice(1, 33);
	} catch (error) {
		throw new Secp256k1Error(`ECDH failed: ${error}`, {
			code: "ECDH_FAILED",
			context: {
				privateKeyLength: privateKey.length,
				publicKeyLength: publicKey.length,
			},
			docsPath: "/crypto/secp256k1/ecdh#error-handling",
			cause: error,
		});
	}
}
