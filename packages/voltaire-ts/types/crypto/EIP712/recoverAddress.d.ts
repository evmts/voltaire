/**
 * Factory: Recover Ethereum address from EIP-712 typed data signature.
 *
 * Uses ECDSA public key recovery to determine the signer's address.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(signature: Uint8Array, hash: Uint8Array, recoveryBit: number) => Uint8Array} deps.recoverPublicKey - Secp256k1 public key recovery function
 * @param {(typedData: import('./EIP712Type.js').TypedData) => import('../../primitives/Hash/index.js').HashType} deps.hashTypedData - Hash typed data function
 * @returns {(signature: import('./EIP712Type.js').Signature, typedData: import('./EIP712Type.js').TypedData) => import('../../primitives/Address/index.js').AddressType} Function that recovers address
 * @throws {Eip712Error} If signature recovery fails or public key format is invalid
 * @example
 * ```javascript
 * import { RecoverAddress } from './crypto/EIP712/recoverAddress.js';
 * import { hash as keccak256 } from '../Keccak256/hash.js';
 * import { recoverPublicKey } from '../Secp256k1/recoverPublicKey.js';
 * import { HashTypedData } from './hashTypedData.js';
 * const hashTypedData = HashTypedData({ keccak256, hashDomain, hashStruct });
 * const recoverAddress = RecoverAddress({ keccak256, recoverPublicKey, hashTypedData });
 * const address = recoverAddress(signature, typedData);
 * ```
 */
export function RecoverAddress({ keccak256, recoverPublicKey, hashTypedData }: {
    keccak256: (data: Uint8Array) => Uint8Array;
    recoverPublicKey: (signature: Uint8Array, hash: Uint8Array, recoveryBit: number) => Uint8Array;
    hashTypedData: (typedData: import("./EIP712Type.js").TypedData) => import("../../primitives/Hash/index.js").HashType;
}): (signature: import("./EIP712Type.js").Signature, typedData: import("./EIP712Type.js").TypedData) => import("../../primitives/Address/index.js").AddressType;
//# sourceMappingURL=recoverAddress.d.ts.map