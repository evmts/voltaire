/**
 * Factory: Verify EIP-712 typed data signature against expected signer address.
 *
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Object} deps - Crypto dependencies
 * @param {(signature: import('./EIP712Type.js').Signature, typedData: import('./EIP712Type.js').TypedData) => import('../../primitives/Address/index.js').AddressType} deps.recoverAddress - Recover address function
 * @returns {(signature: import('./EIP712Type.js').Signature, typedData: import('./EIP712Type.js').TypedData, address: import('../../primitives/Address/index.js').AddressType) => boolean} Function that verifies signature
 * @throws {never}
 * @example
 * ```javascript
 * import { VerifyTypedData } from './crypto/EIP712/verifyTypedData.js';
 * import { RecoverAddress } from './recoverAddress.js';
 * import { hash as keccak256 } from '../Keccak256/hash.js';
 * import { recoverPublicKey } from '../Secp256k1/recoverPublicKey.js';
 * const recoverAddress = RecoverAddress({ keccak256, recoverPublicKey, hashTypedData });
 * const verifyTypedData = VerifyTypedData({ recoverAddress });
 * const valid = verifyTypedData(signature, typedData, signerAddress);
 * ```
 */
export function VerifyTypedData({ recoverAddress }: {
    recoverAddress: (signature: import("./EIP712Type.js").Signature, typedData: import("./EIP712Type.js").TypedData) => import("../../primitives/Address/index.js").AddressType;
}): (signature: import("./EIP712Type.js").Signature, typedData: import("./EIP712Type.js").TypedData, address: import("../../primitives/Address/index.js").AddressType) => boolean;
//# sourceMappingURL=verifyTypedData.d.ts.map