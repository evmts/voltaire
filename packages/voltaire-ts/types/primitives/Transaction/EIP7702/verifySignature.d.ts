/**
 * Factory: Verify transaction signature.
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(data: import('../../Rlp/encode.js').Encodable) => Uint8Array} deps.rlpEncode - RLP encode function
 * @param {*} deps.secp256k1RecoverPublicKey - secp256k1 public key recovery
 * @param {*} deps.secp256k1Verify - secp256k1 signature verification
 * @returns {(tx: import('./BrandedTransactionEIP7702.js').BrandedTransactionEIP7702) => boolean} Function that verifies signature
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @throws {never} Never throws - returns false on error
 * @example
 * ```javascript
 * import { VerifySignature } from './primitives/Transaction/EIP7702/verifySignature.js';
 * import { hash as keccak256 } from '../../../crypto/Keccak256/hash.js';
 * import { encode as rlpEncode } from '../../Rlp/encode.js';
 * import { recoverPublicKey, verify } from '../../../crypto/Secp256k1/index.js';
 * const verifySignature = VerifySignature({
 *   keccak256,
 *   rlpEncode,
 *   secp256k1RecoverPublicKey: recoverPublicKey,
 *   secp256k1Verify: verify
 * });
 * const isValid = verifySignature(tx);
 * ```
 */
export function VerifySignature({ keccak256, rlpEncode, secp256k1RecoverPublicKey, secp256k1Verify, }: {
    keccak256: (data: Uint8Array) => Uint8Array;
    rlpEncode: (data: import("../../Rlp/encode.js").Encodable) => Uint8Array;
    secp256k1RecoverPublicKey: any;
    secp256k1Verify: any;
}): (tx: import("./BrandedTransactionEIP7702.js").BrandedTransactionEIP7702) => boolean;
export const verifySignature: (tx: import("./BrandedTransactionEIP7702.js").BrandedTransactionEIP7702) => boolean;
//# sourceMappingURL=verifySignature.d.ts.map