import { recoverAddress } from "../utils.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Get sender address from transaction signature (EIP-1559).
 *
 * Recovers the sender address from transaction signature components (r, s, yParity).
 * Returns a BrandedAddress (20 bytes). Assumes transaction uses branded types
 * with validated signature components.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {import('./TransactionEIP1559Type.js').BrandedTransactionEIP1559} tx - Signed transaction with BrandedAddress fields
 * @returns {import('../../Address/index.js').AddressType} Sender address (20 bytes, branded)
 * @throws {Error} If signature recovery fails
 * @example
 * ```javascript
 * import { getSender } from './primitives/Transaction/EIP1559/getSender.js';
 * const sender = getSender(tx); // Returns BrandedAddress
 * ```
 */
export function getSender(tx) {
	const signingHash = /** @type {import('../../Hash/index.js').HashType} */ (getSigningHash(tx));
	const v = 27 + tx.yParity;
	return recoverAddress({ r: tx.r, s: tx.s, v }, signingHash);
}
