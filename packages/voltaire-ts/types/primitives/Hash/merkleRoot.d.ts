/**
 * Factory: Calculate Merkle root of hash array
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(hashes: import('./HashType.js').HashType[]) => import('./HashType.js').HashType} Function that calculates Merkle root
 */
export function MerkleRoot({ keccak256 }: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): (hashes: import("./HashType.js").HashType[]) => import("./HashType.js").HashType;
//# sourceMappingURL=merkleRoot.d.ts.map