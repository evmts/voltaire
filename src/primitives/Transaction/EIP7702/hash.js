import { Keccak256 } from "../../../crypto/keccak256.js";
import { serialize } from "./serialize.js";

/**
 * Compute transaction hash
 *
 * @param {import('./BrandedTransactionEIP7702.js').BrandedTransactionEIP7702} tx - Transaction to hash
 * @returns {import('../../Hash/index.js').BrandedHash} Keccak256 hash of serialized transaction
 *
 * @example
 * ```javascript
 * const txHash = TransactionEIP7702.hash(tx);
 * // Uint8Array(32) containing transaction hash
 * ```
 */
export function hash(tx) {
	return Keccak256.hash(serialize(tx));
}
