import { Keccak256 } from "../../../crypto/Keccak256/index.js";
import { serialize } from "./serialize.js";

/**
 * Compute transaction hash.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {import('./BrandedTransactionEIP4844.js').BrandedTransactionEIP4844} tx - EIP-4844 transaction
 * @returns {import('../../Hash/index.js').BrandedHash} Transaction hash
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { hash } from './primitives/Transaction/EIP4844/hash.js';
 * const txHash = hash(tx);
 * ```
 */
export function hash(tx) {
	return Keccak256.hash(serialize(tx));
}
