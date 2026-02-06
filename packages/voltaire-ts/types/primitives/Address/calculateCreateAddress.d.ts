/**
 * Factory for CREATE contract address calculation with injected dependencies
 *
 * @param {Object} deps - Dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(items: any[]) => Uint8Array} deps.rlpEncode - RLP encode function
 * @returns {(address: import('./AddressType.js').AddressType, nonce: bigint) => import('./AddressType.js').AddressType}
 *
 * @example
 * ```typescript
 * import { hash } from '../../../crypto/Keccak256/hash.js'
 * import { encode } from '../../Rlp/encode.js'
 * const calculateCreateAddress = CalculateCreateAddress({
 *   keccak256: hash,
 *   rlpEncode: encode
 * })
 * const contractAddr = calculateCreateAddress(deployerAddr, 5n);
 * ```
 */
export function CalculateCreateAddress({ keccak256, rlpEncode }: {
    keccak256: (data: Uint8Array) => Uint8Array;
    rlpEncode: (items: any[]) => Uint8Array;
}): (address: import("./AddressType.js").AddressType, nonce: bigint) => import("./AddressType.js").AddressType;
//# sourceMappingURL=calculateCreateAddress.d.ts.map