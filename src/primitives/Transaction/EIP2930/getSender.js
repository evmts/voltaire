import { recoverAddress } from "../utils.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Get sender address from EIP-2930 transaction signature
 *
 * @param {import('./BrandedTransactionEIP2930.js').BrandedTransactionEIP2930} tx - Transaction
 * @returns {import('../../Address/index.js').BrandedAddress} Sender address
 *
 * @example
 * ```typescript
 * const sender = TransactionEIP2930.getSender(tx);
 * ```
 */
export function getSender(tx) {
	const signingHash = getSigningHash(tx);
	const v = 27 + tx.yParity;
	return recoverAddress({ r: tx.r, s: tx.s, v }, signingHash);
}
