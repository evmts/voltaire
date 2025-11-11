// @ts-nocheck
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { PUBLIC_KEY_SIZE } from "./constants.js";

/**
 * Validate public key
 *
 * Checks that the public key is a valid point on the secp256k1 curve.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} publicKey - 64-byte uncompressed public key
 * @returns {boolean} true if public key is valid, false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * const publicKey = new Uint8Array(64);
 * const valid = Secp256k1.isValidPublicKey(publicKey);
 * ```
 */
export function isValidPublicKey(publicKey) {
	if (publicKey.length !== PUBLIC_KEY_SIZE) return false;

	try {
		// Add 0x04 prefix for uncompressed key
		const prefixedKey = new Uint8Array(PUBLIC_KEY_SIZE + 1);
		prefixedKey[0] = 0x04;
		prefixedKey.set(publicKey, 1);

		// Try to create a point from bytes - will throw if invalid
		secp256k1.Point.fromBytes(prefixedKey);
		return true;
	} catch {
		return false;
	}
}
