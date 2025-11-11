import { Secp256k1 } from "../../../crypto/Secp256k1/index.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Verify authorization signature.
 *
 * Validates that the signature (r, s, yParity) is valid for the
 * authorization's signing hash by recovering and verifying the public key.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {import('./BrandedAuthorization.js').BrandedAuthorization} auth - Authorization to verify
 * @returns {boolean} True if signature is valid
 * @throws {never} Never throws - returns false on error
 * @example
 * ```javascript
 * import { verifySignature } from './primitives/Transaction/Authorization/verifySignature.js';
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
