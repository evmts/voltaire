/**
 * MerkleTree represents a binary Merkle tree with proof generation and verification.
 *
 * Key features:
 * - Proof length validation against tree depth
 * - Keccak256 hashing for node combination
 * - Support for both balanced and unbalanced trees
 */

import type { HashType } from "../Hash/HashType.js";

/**
 * Merkle proof with metadata for verification
 */
export type MerkleProofType = {
	/** Leaf value being proven */
	readonly leaf: HashType;
	/** Sibling hashes from leaf to root */
	readonly siblings: readonly HashType[];
	/** Leaf index in the tree (determines left/right ordering) */
	readonly leafIndex: number;
	/** Expected tree depth (for proof length validation) */
	readonly treeDepth: number;
};

/**
 * MerkleTree structure
 */
export type MerkleTreeType = {
	/** Root hash of the tree */
	readonly root: HashType;
	/** Number of leaves in the tree */
	readonly leafCount: number;
	/** Tree depth (log2 of leaf count, rounded up) */
	readonly depth: number;
	/** All leaves in the tree */
	readonly leaves: readonly HashType[];
};

/**
 * Input types that can be converted to MerkleTree
 */
export type MerkleTreeLike =
	| MerkleTreeType
	| {
			leaves: readonly HashType[];
	  };

/**
 * Input types that can be converted to MerkleProof
 */
export type MerkleProofLike =
	| MerkleProofType
	| {
			leaf: HashType;
			siblings: readonly HashType[];
			leafIndex: number;
			treeDepth: number;
	  };
