import { Keccak256 } from "../../../crypto/keccak256.js";
import { serialize } from "./serialize.js";

/**
 * Compute transaction hash
 *
 * @param {import('./BrandedTransactionEIP4844.js').BrandedTransactionEIP4844} tx - EIP-4844 transaction
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
