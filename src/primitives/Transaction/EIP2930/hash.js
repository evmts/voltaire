import { serialize } from "./serialize.js";

/**
 * Factory: Compute transaction hash.
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(tx: import('./BrandedTransactionEIP2930.js').BrandedTransactionEIP2930) => import('../../Hash/index.js').BrandedHash} Function that computes transaction hash
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { Hash } from './primitives/Transaction/EIP2930/hash.js';
 * import { hash as keccak256 } from '../../../crypto/Keccak256/hash.js';
 * const hash = Hash({ keccak256 });
 * const txHash = hash(tx);
 * ```
 */
export function Hash({ keccak256 }) {
	return function hash(tx) {
		return keccak256(serialize(tx));
	};
}
