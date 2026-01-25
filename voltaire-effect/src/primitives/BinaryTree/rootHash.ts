import { BinaryTree } from "@tevm/voltaire";

type BinaryTreeType = BinaryTree.BinaryTreeType;

/**
 * Computes the Merkle root hash of the binary tree.
 * Pure function - never throws.
 *
 * @param tree - The binary tree to compute root hash for
 * @returns 32-byte root hash as Uint8Array
 *
 * @example
 * ```typescript
 * import * as BinaryTree from 'voltaire-effect/primitives/BinaryTree'
 *
 * const hash = BinaryTree.rootHash(tree)
 * ```
 *
 * @since 0.0.1
 */
export const rootHash = (tree: BinaryTreeType): Uint8Array =>
	BinaryTree.rootHash(tree);
