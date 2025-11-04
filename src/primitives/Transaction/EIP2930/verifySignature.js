import { Secp256k1 } from "../../../crypto/secp256k1.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Verify EIP-2930 transaction signature
 *
 * @param {import('./BrandedTransactionEIP2930.js').BrandedTransactionEIP2930} tx - Transaction to verify
 * @returns {boolean} True if signature is valid
 *
 * @example
 * ```typescript
 * const isValid = TransactionEIP2930.verifySignature(tx);
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
