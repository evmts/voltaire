import { Secp256k1 } from "../../../crypto/Secp256k1/index.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Verify authorization signature
 *
 * Validates that the signature (r, s, yParity) is valid for the
 * authorization's signing hash by recovering and verifying the public key.
 *
 * @param {import('./BrandedAuthorization.js').BrandedAuthorization} auth - Authorization to verify
 * @returns {boolean} True if signature is valid
 *
 * @example
 * ```typescript
 * const isValid = verifySignature(auth);
 * ```
 */
export function verifySignature(auth) {
	try {
		const signingHash = getSigningHash(auth);
		const v = 27 + auth.yParity;
		const publicKey = Secp256k1.recoverPublicKey(
			{ r: auth.r, s: auth.s, v },
			signingHash,
		);
		return Secp256k1.verify(
			{ r: auth.r, s: auth.s, v },
			signingHash,
			publicKey,
		);
	} catch {
		return false;
	}
}
