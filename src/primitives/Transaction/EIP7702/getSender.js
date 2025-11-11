import { recoverAddress } from "../utils.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Get sender address from signature.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {import('./BrandedTransactionEIP7702.js').BrandedTransactionEIP7702} tx - Transaction with signature
 * @returns {import('../../Address/index.js').BrandedAddress} Recovered sender address
 * @throws {Error} If signature recovery fails
 * @example
 * ```javascript
 * import { getSender } from './primitives/Transaction/EIP7702/getSender.js';
 * const sender = getSender(tx);
 * ```
 */
export function getSender(tx) {
	const signingHash = getSigningHash(tx);
	const v = 27 + tx.yParity;
	return recoverAddress({ r: tx.r, s: tx.s, v }, signingHash);
}
