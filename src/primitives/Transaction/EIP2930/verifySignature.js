import { Hash } from "../../Hash/index.js";
import { Secp256k1 } from "../../../crypto/Secp256k1/index.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Verify EIP-2930 transaction signature.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {import('./BrandedTransactionEIP2930.js').BrandedTransactionEIP2930} tx - Transaction to verify
 * @returns {boolean} True if signature is valid
 * @throws {never} Never throws - returns false on error
 * @example
 * ```javascript
 * import { verifySignature } from './primitives/Transaction/EIP2930/verifySignature.js';
 * const isValid = verifySignature(tx);
 * ```
 */
export function verifySignature(tx) {
	try {
		const signingHash = getSigningHash(tx);
		const v = 27 + tx.yParity;
		const r = Hash.from(tx.r);
		const s = Hash.from(tx.s);
		const publicKey = Secp256k1.recoverPublicKey({ r, s, v }, signingHash);
		return Secp256k1.verify({ r, s, v }, signingHash, publicKey);
	} catch {
		return false;
	}
}
