import { recoverAddress } from "../utils.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Get sender address from signature
 *
 * @param {import('./BrandedTransactionEIP4844.js').BrandedTransactionEIP4844} tx - EIP-4844 transaction
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
