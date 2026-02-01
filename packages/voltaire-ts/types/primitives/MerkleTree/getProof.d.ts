/**
 * Factory: Generate Merkle proof for a leaf
 * @param {Object} deps
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256
 * @returns {(leaves: import('../Hash/HashType.js').HashType[], leafIndex: number) => import('./MerkleTreeType.js').MerkleProofType}
 */
export function GetProof({ keccak256 }: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): (leaves: import("../Hash/HashType.js").HashType[], leafIndex: number) => import("./MerkleTreeType.js").MerkleProofType;
//# sourceMappingURL=getProof.d.ts.map