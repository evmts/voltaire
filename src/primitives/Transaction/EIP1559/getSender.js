import { recoverAddress } from "../utils.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Get sender address from transaction signature
 *
 * @param {import('./BrandedTransactionEIP1559.js').BrandedTransactionEIP1559} tx - Signed transaction
 * @returns {import('../../Address/index.js').BrandedAddress} Sender address
 *
 * @example
 * ```typescript
 * const sender = getSender(tx);
 * ```
 */
export function getSender(tx) {
	const signingHash = getSigningHash(tx);
	const v = 27 + tx.yParity;
	return recoverAddress({ r: tx.r, s: tx.s, v }, signingHash);
}
