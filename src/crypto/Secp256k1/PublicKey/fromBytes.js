// @ts-nocheck
import { InvalidPublicKeyError } from "../errors.js";
import { isValidPublicKey } from "../isValidPublicKey.js";

/**
 * Create a Secp256k1PublicKeyType from 64 raw bytes
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - 64-byte uncompressed public key
 * @returns {import('../Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} Branded public key
 * @throws {InvalidPublicKeyError} If public key length is invalid or not a valid curve point
 * @example
 * ```javascript
 * import * as PublicKey from './crypto/Secp256k1/PublicKey/index.js';
 * const publicKey = PublicKey.fromBytes(keyBytes);
 * ```
 */
export function fromBytes(bytes) {
	if (bytes.length !== 64) {
		throw new InvalidPublicKeyError(
			`Invalid public key: expected 64 bytes, got ${bytes.length}`,
			{
				code: "SECP256K1_INVALID_PUBLIC_KEY_LENGTH",
				context: { length: bytes.length, expected: 64 },
				docsPath: "/crypto/secp256k1/public-key#error-handling",
			},
		);
	}
	if (!isValidPublicKey(bytes)) {
		throw new InvalidPublicKeyError(
			"Invalid public key: not a valid point on the secp256k1 curve",
			{
				code: "SECP256K1_INVALID_CURVE_POINT",
				context: { publicKeyLength: bytes.length },
				docsPath: "/crypto/secp256k1/public-key#error-handling",
			},
		);
	}
	return /** @type {import('../Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} */ (
		bytes
	);
}
