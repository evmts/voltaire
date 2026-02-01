import { InvalidProofLengthError } from "./errors.js";
/**
 * Factory: Verify Merkle proof with proof length validation
 * @param {Object} deps
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256
 * @returns {(proof: import('./MerkleTreeType.js').MerkleProofType, expectedRoot: import('../Hash/HashType.js').HashType) => boolean}
 */
export function Verify({ keccak256 }) {
    /**
     * Verify a Merkle proof against an expected root
     *
     * IMPORTANT: This function validates that proof.siblings.length === proof.treeDepth.
     * For a balanced tree with n leaves, depth = ceil(log2(n)).
     * A proof with incorrect length will throw InvalidProofLengthError.
     *
     * @param {import('./MerkleTreeType.js').MerkleProofType} proof - The proof to verify
     * @param {import('../Hash/HashType.js').HashType} expectedRoot - Expected root hash
     * @returns {boolean} True if proof is valid
     * @throws {InvalidProofLengthError} If proof length doesn't match tree depth
     */
    return function verify(proof, expectedRoot) {
        // Validate proof length matches expected tree depth
        if (proof.siblings.length !== proof.treeDepth) {
            throw new InvalidProofLengthError(proof.treeDepth, proof.siblings.length);
        }
        // Empty tree (single leaf) - leaf should equal root
        if (proof.treeDepth === 0) {
            return equalBytes(proof.leaf, expectedRoot);
        }
        let currentHash = proof.leaf;
        let index = proof.leafIndex;
        for (const sibling of proof.siblings) {
            const combined = new Uint8Array(64);
            if (index % 2 === 0) {
                // Current is left child
                combined.set(currentHash, 0);
                combined.set(sibling, 32);
            }
            else {
                // Current is right child
                combined.set(sibling, 0);
                combined.set(currentHash, 32);
            }
            currentHash = /** @type {import('../Hash/HashType.js').HashType} */ (keccak256(combined));
            index = Math.floor(index / 2);
        }
        return equalBytes(currentHash, expectedRoot);
    };
}
/**
 * Compare two byte arrays for equality
 * @param {Uint8Array} a
 * @param {Uint8Array} b
 * @returns {boolean}
 */
function equalBytes(a, b) {
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i])
            return false;
    }
    return true;
}
