import { Secp256k1 } from "../../../crypto/Secp256k1/index.js";
import { getChainId } from "./getChainId.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Verify transaction signature.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @this {import('./BrandedTransactionLegacy.js').BrandedTransactionLegacy}
 * @returns {boolean} True if signature is valid, false otherwise
 * @throws {never} Never throws - returns false on error
 * @example
 * ```javascript
 * import { verifySignature } from './primitives/Transaction/Legacy/verifySignature.js';
 * const isValid = verifySignature.call(tx);
 * ```
 */
export function verifySignature() {
	try {
		const signingHash = getSigningHash.call(this);

		// Convert v to recovery bit
		const chainId = getChainId.call(this);
		let v;
		if (chainId !== null) {
			v = Number(this.v - chainId * 2n - 35n);
		} else {
			v = Number(this.v);
		}

		// Recover public key
		const publicKey = Secp256k1.recoverPublicKey(
			{ r: this.r, s: this.s, v },
			signingHash,
		);

		// Verify signature
		return Secp256k1.verify(
			{ r: this.r, s: this.s, v },
			signingHash,
			publicKey,
		);
	} catch {
		return false;
	}
}
