import { EmptyTreeError, LeafIndexOutOfBoundsError } from "./errors.js";
/**
 * Factory: Generate Merkle proof for a leaf
 * @param {Object} deps
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256
 * @returns {(leaves: import('../Hash/HashType.js').HashType[], leafIndex: number) => import('./MerkleTreeType.js').MerkleProofType}
 */
export function GetProof({ keccak256 }) {
    /**
     * Generate Merkle proof for leaf at given index
     * @param {import('../Hash/HashType.js').HashType[]} leaves - All leaves in the tree
     * @param {number} leafIndex - Index of leaf to prove
     * @returns {import('./MerkleTreeType.js').MerkleProofType}
     */
    return function getProof(leaves, leafIndex) {
        if (leaves.length === 0) {
            throw new EmptyTreeError();
        }
        if (leafIndex < 0 || leafIndex >= leaves.length) {
            throw new LeafIndexOutOfBoundsError(leafIndex, leaves.length);
        }
        const leaf = /** @type {import('../Hash/HashType.js').HashType} */ (leaves[leafIndex]);
        if (leaves.length === 1) {
            return Object.freeze({
                leaf,
                siblings: Object.freeze([]),
                leafIndex: 0,
                treeDepth: 0,
            });
        }
        const depth = Math.ceil(Math.log2(leaves.length));
        const targetLen = 2 ** depth;
        // Pad leaves
        const paddedLeaves = [...leaves];
        const lastLeaf = /** @type {import('../Hash/HashType.js').HashType} */ (leaves[leaves.length - 1]);
        while (paddedLeaves.length < targetLen) {
            paddedLeaves.push(lastLeaf);
        }
        /** @type {import('../Hash/HashType.js').HashType[]} */
        const siblings = [];
        let index = leafIndex;
        /** @type {Uint8Array[]} */
        let currentLevel = paddedLeaves;
        while (currentLevel.length > 1) {
            const siblingIndex = index % 2 === 0 ? index + 1 : index - 1;
            siblings.push(
            /** @type {import('../Hash/HashType.js').HashType} */ (currentLevel[siblingIndex]));
            /** @type {Uint8Array[]} */
            const nextLevel = [];
            for (let i = 0; i < currentLevel.length; i += 2) {
                const left = /** @type {Uint8Array} */ (currentLevel[i]);
                const right = /** @type {Uint8Array} */ (currentLevel[i + 1]);
                const combined = new Uint8Array(64);
                combined.set(left, 0);
                combined.set(right, 32);
                nextLevel.push(keccak256(combined));
            }
            index = Math.floor(index / 2);
            currentLevel = nextLevel;
        }
        return Object.freeze({
            leaf,
            siblings: Object.freeze(siblings),
            leafIndex,
            treeDepth: depth,
        });
    };
}
