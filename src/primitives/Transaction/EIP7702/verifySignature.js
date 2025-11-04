import { Secp256k1 } from "../../../crypto/secp256k1.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Verify transaction signature
 *
 * @param {import('./BrandedTransactionEIP7702.js').BrandedTransactionEIP7702} tx - Transaction with signature
 * @returns {boolean} True if signature is valid, false otherwise
 *
 * @example
 * ```javascript
 * const isValid = TransactionEIP7702.verifySignature(tx);
 * // true or false
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
