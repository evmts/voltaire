import { recoverAddress } from "../utils.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Get sender address from EIP-2930 transaction signature.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {import('./TransactionEIP2930Type.js').TransactionEIP2930Type} tx - Transaction
 * @returns {import('../../Address/index.js').AddressType} Sender address
 * @throws {Error} If signature recovery fails
 * @example
 * ```javascript
 * import { getSender } from './primitives/Transaction/EIP2930/getSender.js';
 * const sender = getSender(tx);
 * ```
 */
export function getSender(tx) {
	const signingHash = /** @type {import('../../Hash/index.js').HashType} */ (getSigningHash(tx));
	const v = 27 + tx.yParity;
	return recoverAddress({ r: tx.r, s: tx.s, v }, signingHash);
}
