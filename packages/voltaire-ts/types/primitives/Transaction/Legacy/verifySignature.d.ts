/**
 * Factory: Verify transaction signature.
 *
 * Verifies that the transaction signature is valid. This checks that:
 * 1. The signature components (r, s) are well-formed
 * 2. The v value is valid (for pre-EIP-155 or EIP-155 format)
 * 3. A public key can be recovered from the signature
 *
 * Note: This does NOT verify the transaction was signed by a specific address.
 * It only validates the signature is cryptographically valid and can recover
 * a sender address. To verify against an expected sender, use getSender() and
 * compare the result.
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(data: import('../../Rlp/encode.js').Encodable) => Uint8Array} deps.rlpEncode - RLP encode function
 * @param {*} deps.secp256k1RecoverPublicKey - secp256k1 public key recovery
 * @returns {(this: import('./TransactionLegacyType.js').TransactionLegacyType) => boolean} Function that verifies signature
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @throws {never} Never throws - returns false on error
 * @example
 * ```javascript
 * import { VerifySignature } from './primitives/Transaction/Legacy/verifySignature.js';
 * import { hash as keccak256 } from '../../../crypto/Keccak256/hash.js';
 * import { encode as rlpEncode } from '../../Rlp/encode.js';
 * import { recoverPublicKey } from '../../../crypto/Secp256k1/index.js';
 * const verifySignature = VerifySignature({
 *   keccak256,
 *   rlpEncode,
 *   secp256k1RecoverPublicKey: recoverPublicKey
 * });
 * const isValid = verifySignature.call(tx);
 * ```
 */
export function VerifySignature({ keccak256, rlpEncode, secp256k1RecoverPublicKey, }: {
    keccak256: (data: Uint8Array) => Uint8Array;
    rlpEncode: (data: import("../../Rlp/encode.js").Encodable) => Uint8Array;
    secp256k1RecoverPublicKey: any;
}): (this: import("./TransactionLegacyType.js").TransactionLegacyType) => boolean;
export const verifySignature: (this: import("./TransactionLegacyType.js").TransactionLegacyType) => boolean;
//# sourceMappingURL=verifySignature.d.ts.map