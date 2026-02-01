/**
 * Factory: Get signing hash for Legacy transaction.
 *
 * Computes the Keccak256 hash of the RLP-encoded transaction fields that need
 * to be signed. Handles both EIP-155 (with chainId) and pre-EIP-155 formats.
 * The transaction uses BrandedAddress for `to` field, assumed to be validated
 * (20 bytes or null). Returns a HashType (32 bytes).
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(data: import('../../Rlp/encode.js').Encodable) => Uint8Array} deps.rlpEncode - RLP encode function
 * @returns {(this: import('./TransactionLegacyType.js').TransactionLegacyType) => Uint8Array} Function that computes signing hash
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { GetSigningHash } from './primitives/Transaction/Legacy/getSigningHash.js';
 * import { hash as keccak256 } from '../../../crypto/Keccak256/hash.js';
 * import { encode as rlpEncode } from '../../Rlp/encode.js';
 * const getSigningHash = GetSigningHash({ keccak256, rlpEncode });
 * const signingHash = getSigningHash.call(tx);
 * ```
 */
export function GetSigningHash({ keccak256, rlpEncode }: {
    keccak256: (data: Uint8Array) => Uint8Array;
    rlpEncode: (data: import("../../Rlp/encode.js").Encodable) => Uint8Array;
}): (this: import("./TransactionLegacyType.js").TransactionLegacyType) => Uint8Array;
export const getSigningHash: (this: import("./TransactionLegacyType.js").TransactionLegacyType) => Uint8Array;
//# sourceMappingURL=getSigningHash.d.ts.map