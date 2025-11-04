import { Keccak256 } from "../../../crypto/keccak256.js";
import { serialize } from "./serialize.js";

/**
 * Compute transaction hash
 *
 * @param {import('./BrandedTransactionEIP2930.js').BrandedTransactionEIP2930} tx - Transaction to hash
 * @returns {import('../../Hash/index.js').BrandedHash} Transaction hash
 *
 * @example
 * ```typescript
 * const txHash = TransactionEIP2930.hash(tx);
 * ```
 */
export function hash(tx) {
	return Keccak256.hash(serialize(tx));
}
