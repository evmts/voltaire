import { Keccak256 } from "../../../crypto/Keccak256/index.js";
import { serialize } from "./serialize.js";

/**
 * Compute transaction hash.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {import('./BrandedTransactionEIP2930.js').BrandedTransactionEIP2930} tx - Transaction to hash
 * @returns {import('../../Hash/index.js').BrandedHash} Transaction hash
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { hash } from './primitives/Transaction/EIP2930/hash.js';
 * const txHash = hash(tx);
 * ```
 */
export function hash(tx) {
	return Keccak256.hash(serialize(tx));
}
