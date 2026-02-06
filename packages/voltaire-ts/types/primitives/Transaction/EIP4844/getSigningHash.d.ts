/**
 * Factory: Get signing hash for EIP-4844 transaction.
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(data: import('../../Rlp/encode.js').Encodable) => Uint8Array} deps.rlpEncode - RLP encode function
 * @returns {(tx: import('./TransactionEIP4844Type.js').TransactionEIP4844Type) => Uint8Array} Function that computes signing hash
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { GetSigningHash } from './primitives/Transaction/EIP4844/getSigningHash.js';
 * import { hash as keccak256 } from '../../../crypto/Keccak256/hash.js';
 * import { encode as rlpEncode } from '../../Rlp/encode.js';
 * const getSigningHash = GetSigningHash({ keccak256, rlpEncode });
 * const sigHash = getSigningHash(tx);
 * ```
 */
export function GetSigningHash({ keccak256, rlpEncode }: {
    keccak256: (data: Uint8Array) => Uint8Array;
    rlpEncode: (data: import("../../Rlp/encode.js").Encodable) => Uint8Array;
}): (tx: import("./TransactionEIP4844Type.js").TransactionEIP4844Type) => Uint8Array;
export const getSigningHash: (tx: import("./TransactionEIP4844Type.js").TransactionEIP4844Type) => Uint8Array;
//# sourceMappingURL=getSigningHash.d.ts.map