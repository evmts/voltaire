import { recoverAddress } from "../utils.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Get sender address from signature
 *
 * @param {import('./BrandedTransactionEIP7702.js').BrandedTransactionEIP7702} tx - Transaction with signature
 * @returns {import('../../Address/index.js').BrandedAddress} Recovered sender address
 *
 * @example
 * ```javascript
 * const sender = TransactionEIP7702.getSender(tx);
 * // Address of transaction signer
 * ```
 */
export function getSender(tx) {
	const signingHash = getSigningHash(tx);
	const v = 27 + tx.yParity;
	return recoverAddress({ r: tx.r, s: tx.s, v }, signingHash);
}
