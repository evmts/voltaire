// @ts-nocheck
import { isValidPublicKey } from "../isValidPublicKey.js";

/**
 * Create a Secp256k1PublicKeyType from 64 raw bytes
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - 64-byte uncompressed public key
 * @returns {import('../Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} Branded public key
 * @throws {Error} If public key is invalid
 * @example
 * ```javascript
 * import * as PublicKey from './crypto/Secp256k1/PublicKey/index.js';
 * const publicKey = PublicKey.fromBytes(keyBytes);
 * ```
 */
export function fromBytes(bytes) {
	if (!isValidPublicKey(bytes)) {
		throw new Error(
			`Invalid public key: expected 64 bytes, got ${bytes.length}`,
		);
	}
	return /** @type {import('../Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} */ (
		bytes
	);
}
