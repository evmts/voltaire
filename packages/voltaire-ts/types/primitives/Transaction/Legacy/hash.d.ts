/**
 * Factory: Compute transaction hash (keccak256 of serialized transaction).
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(this: import('./TransactionLegacyType.js').TransactionLegacyType) => Uint8Array} Function that computes transaction hash
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
export function Hash({ keccak256 }: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): (this: import("./TransactionLegacyType.js").TransactionLegacyType) => Uint8Array;
export const hash: (this: import("./TransactionLegacyType.js").TransactionLegacyType) => Uint8Array;
//# sourceMappingURL=hash.d.ts.map