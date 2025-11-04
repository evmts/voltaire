import { Keccak256 } from "../../../crypto/Keccak256/index.js";
import { serialize } from "./serialize.js";

/**
 * Compute transaction hash (keccak256 of serialized transaction)
 *
 * @this {import('./BrandedTransactionLegacy.js').BrandedTransactionLegacy}
 * @returns {import('../../Hash/index.js').BrandedHash} Transaction hash
 *
 * @example
 * ```typescript
 * const txHash = TransactionLegacy.hash.call(tx);
 * ```
 */
export function hash() {
	return Keccak256.hash(serialize.call(this));
}
