/**
 * Factory: Verify Merkle proof with proof length validation
 * @param {Object} deps
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256
 * @returns {(proof: import('./MerkleTreeType.js').MerkleProofType, expectedRoot: import('../Hash/HashType.js').HashType) => boolean}
 */
export function Verify({ keccak256 }: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): (proof: import("./MerkleTreeType.js").MerkleProofType, expectedRoot: import("../Hash/HashType.js").HashType) => boolean;
//# sourceMappingURL=verify.d.ts.map