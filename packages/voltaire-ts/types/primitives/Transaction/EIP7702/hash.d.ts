/**
 * Factory: Compute transaction hash.
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(tx: import('./BrandedTransactionEIP7702.js').BrandedTransactionEIP7702) => Uint8Array} Function that computes transaction hash
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { Hash } from './primitives/Transaction/EIP7702/hash.js';
 * import { hash as keccak256 } from '../../../crypto/Keccak256/hash.js';
 * const hash = Hash({ keccak256 });
 * const txHash = hash(tx);
 * ```
 */
export function Hash({ keccak256 }: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): (tx: import("./BrandedTransactionEIP7702.js").BrandedTransactionEIP7702) => Uint8Array;
export const hash: (tx: import("./BrandedTransactionEIP7702.js").BrandedTransactionEIP7702) => Uint8Array;
//# sourceMappingURL=hash.d.ts.map