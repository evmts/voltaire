/**
 * Factory: Create EIP-191 personal message hash function
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(message: Uint8Array | string) => import('../Hash/HashType.js').HashType}
 */
export function Hash({ keccak256 }: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): (message: Uint8Array | string) => import("../Hash/HashType.js").HashType;
//# sourceMappingURL=hash.d.ts.map