import { Keccak256 } from "../../../crypto/Keccak256/index.js";
import { serialize } from "./serialize.js";

/**
 * Compute transaction hash
 *
 * @param {import('./BrandedTransactionEIP1559.js').BrandedTransactionEIP1559} tx - Transaction to hash
 * @returns {import('../../Hash/index.js').BrandedHash} Transaction hash
 *
 * @example
 * ```typescript
 * const txHash = hash(tx);
 * ```
 */
export function hash(tx) {
	return Keccak256.hash(serialize(tx));
}
