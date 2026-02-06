/**
 * Factory: Create Address from secp256k1 private key
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(privateKey: Uint8Array) => Uint8Array} deps.derivePublicKey - Secp256k1 public key derivation function
 * @returns {(privateKey: import('../../../primitives/PrivateKey/PrivateKeyType.js').PrivateKeyType) => import('./AddressType.js').AddressType} Function that creates Address from private key
 *
 * @example
 * ```typescript
 * import { FromPrivateKey } from '@tevm/voltaire/Address/BrandedAddress'
 * import { hash as keccak256 } from '@tevm/voltaire/crypto/Keccak256'
 * import { derivePublicKey } from '@tevm/voltaire/crypto/Secp256k1'
 *
 * const fromPrivateKey = FromPrivateKey({ keccak256, derivePublicKey })
 * const addr = fromPrivateKey(privateKey)
 * ```
 */
export function FromPrivateKey({ keccak256, derivePublicKey }: {
    keccak256: (data: Uint8Array) => Uint8Array;
    derivePublicKey: (privateKey: Uint8Array) => Uint8Array;
}): (privateKey: any) => import("./AddressType.js").AddressType;
//# sourceMappingURL=fromPrivateKey.d.ts.map