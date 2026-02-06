/**
 * Factory: Create MerkleTree from leaves
 * @param {Object} deps
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256
 * @returns {(leaves: import('../Hash/HashType.js').HashType[]) => import('./MerkleTreeType.js').MerkleTreeType}
 */
export function From({ keccak256 }: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): (leaves: import("../Hash/HashType.js").HashType[]) => import("./MerkleTreeType.js").MerkleTreeType;
//# sourceMappingURL=from.d.ts.map