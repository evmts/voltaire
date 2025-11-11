import { recoverAddress } from "../utils.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Get sender address from signature.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {import('./BrandedTransactionEIP4844.js').BrandedTransactionEIP4844} tx - EIP-4844 transaction
 * @returns {import('../../Address/index.js').BrandedAddress} Sender address
 * @throws {Error} If signature recovery fails
 * @example
 * ```javascript
 * import { getSender } from './primitives/Transaction/EIP4844/getSender.js';
 * const sender = getSender(tx);
 * ```
 */
export function getSender(tx) {
	const signingHash = getSigningHash(tx);
	const v = 27 + tx.yParity;
	return recoverAddress({ r: tx.r, s: tx.s, v }, signingHash);
}
