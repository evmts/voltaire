import { Hash } from "../../Hash/index.js";
import { Secp256k1 } from "../../../crypto/Secp256k1/index.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Verify transaction signature.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {import('./BrandedTransactionEIP7702.js').BrandedTransactionEIP7702} tx - Transaction with signature
 * @returns {boolean} True if signature is valid, false otherwise
 * @throws {never} Never throws - returns false on error
 * @example
 * ```javascript
 * import { verifySignature } from './primitives/Transaction/EIP7702/verifySignature.js';
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
