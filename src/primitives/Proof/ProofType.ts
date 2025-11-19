/**
 * Proof represents a generic Merkle proof for verifying inclusion in a Merkle tree.
 *
 * A Merkle proof consists of:
 * - value: The leaf value being proven
 * - proof: An array of sibling hashes forming the path from leaf to root
 *
 * To verify, you hash the value with each proof element in order, reconstructing
 * the path to the root hash. If the final hash matches the known root, the proof
 * is valid.
 *
 * This generic structure is used as the basis for more specific proof types like
 * StateProof and StorageProof which follow the Ethereum Merkle Patricia Trie format.
 */
export type ProofType = {
	/**
	 * The leaf value being proven for inclusion.
	 * This is typically a hash or encoded data.
	 */
	readonly value: Uint8Array;

	/**
	 * Array of sibling hashes forming the Merkle branch.
	 * Each element is a node hash encountered on the path from leaf to root.
	 * Order matters - typically bottom-up (leaf to root).
	 */
	readonly proof: readonly Uint8Array[];
};

/**
 * Inputs that can be converted to Proof
 */
export type ProofLike =
	| ProofType
	| {
			value: Uint8Array;
			proof: readonly Uint8Array[];
	  };
