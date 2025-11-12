import type { BrandedAddress } from "../Address/BrandedAddress/BrandedAddress.js";
import type { Any } from "./types.js";

/**
 * Get recipient address from transaction.
 *
 * Returns the `to` field of the transaction. For contract creation transactions
 * where `to` is null, this returns null.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param this Transaction
 * @returns Recipient address or null for contract creation
 * @example
 * ```javascript
 * import { getRecipient } from './primitives/Transaction/getRecipient.js';
 * const recipient = getRecipient.call(tx);
 * ```
 */
export function getRecipient(this: Any): BrandedAddress | null {
	return this.to;
}
