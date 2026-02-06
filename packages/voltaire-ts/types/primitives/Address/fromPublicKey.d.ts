/**
 * Factory: Create Address from secp256k1 public key
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(xOrPublicKey: bigint | Uint8Array, y?: bigint) => import('./AddressType.js').AddressType} Function that creates Address from public key
 * @throws {InvalidAddressLengthError} If Uint8Array public key is not 64 bytes
 * @throws {InvalidValueError} If x is bigint but y is not provided as bigint
 *
 * @example
 * ```typescript
 * import { FromPublicKey } from '@tevm/voltaire/Address/BrandedAddress'
 * import { hash as keccak256 } from '@tevm/voltaire/crypto/Keccak256'
 *
 * const fromPublicKey = FromPublicKey({ keccak256 })
 * // From coordinates
 * const addr1 = fromPublicKey(xCoord, yCoord)
 * // From 64-byte public key
 * const addr2 = fromPublicKey(publicKeyBytes)
 * ```
 */
export function FromPublicKey({ keccak256 }: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): (xOrPublicKey: bigint | Uint8Array, y?: bigint) => import("./AddressType.js").AddressType;
//# sourceMappingURL=fromPublicKey.d.ts.map