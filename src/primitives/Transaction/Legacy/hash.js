import { Keccak256 } from "../../../crypto/Keccak256/index.js";
import { serialize } from "./serialize.js";

/**
 * Compute transaction hash (keccak256 of serialized transaction).
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @this {import('./BrandedTransactionLegacy.js').BrandedTransactionLegacy}
 * @returns {import('../../Hash/index.js').BrandedHash} Transaction hash
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { hash } from './primitives/Transaction/Legacy/hash.js';
 * const txHash = hash.call(tx);
 * ```
 */
export function hash() {
	return Keccak256.hash(serialize.call(this));
}
