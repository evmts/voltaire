/**
 * Factory: Calculate signing hash for authorization
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(data: Array<Uint8Array>) => Uint8Array} deps.rlpEncode - RLP encode function
 * @returns {(unsigned: {chainId: bigint, address: import("../Address/AddressType.js").AddressType, nonce: bigint}) => import("../Hash/HashType.js").HashType} Function that hashes unsigned authorization
 */
export function Hash({ keccak256, rlpEncode }: {
    keccak256: (data: Uint8Array) => Uint8Array;
    rlpEncode: (data: Array<Uint8Array>) => Uint8Array;
}): (unsigned: {
    chainId: bigint;
    address: import("../Address/AddressType.js").AddressType;
    nonce: bigint;
}) => import("../Hash/HashType.js").HashType;
//# sourceMappingURL=hash.d.ts.map