import { Secp256k1 } from "../../../crypto/secp256k1.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Verify transaction signature
 *
 * @param {import('./BrandedTransactionEIP4844.js').BrandedTransactionEIP4844} tx - EIP-4844 transaction
 * @returns {boolean} True if signature is valid
 *
 * @example
 * ```typescript
 * const isValid = verifySignature(tx);
 * ```
 */
export function verifySignature(tx) {
	try {
		const signingHash = getSigningHash(tx);
		const v = 27 + tx.yParity;
		const publicKey = Secp256k1.recoverPublicKey(
			{ r: tx.r, s: tx.s, v },
			signingHash,
		);
		return Secp256k1.verify(
			{ r: tx.r, s: tx.s, v },
			signingHash,
			publicKey,
		);
	} catch {
		return false;
	}
}
