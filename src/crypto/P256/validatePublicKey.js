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
 * @param {import('./P256PublicKeyType.js').P256PublicKeyType} publicKey - Public key to validate
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
		// Add 0x04 prefix for uncompressed point format
		const fullPublicKey = new Uint8Array(65);
		fullPublicKey[0] = 0x04;
		fullPublicKey.set(publicKey, 1);

		// Use @noble/curves' ProjectivePoint.fromHex to validate the point
		// This properly checks if the point is on the curve
		p256.ProjectivePoint.fromHex(fullPublicKey);
		return true;
	} catch {
		return false;
	}
}
