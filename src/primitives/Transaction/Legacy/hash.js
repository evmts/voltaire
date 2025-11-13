import { serialize } from "./serialize.js";

/**
 * Factory: Compute transaction hash (keccak256 of serialized transaction).
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(tx: import('./BrandedTransactionLegacy.js').BrandedTransactionLegacy) => import('../../Hash/index.js').BrandedHash} Function that computes transaction hash
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { Hash } from './primitives/Transaction/Legacy/hash.js';
 * import { hash as keccak256 } from '../../../crypto/Keccak256/hash.js';
 * const hash = Hash({ keccak256 });
 * const txHash = hash.call(tx);
 * ```
 */
export function Hash({ keccak256 }) {
	return function hash() {
		return keccak256(serialize.call(this));
	};
}
