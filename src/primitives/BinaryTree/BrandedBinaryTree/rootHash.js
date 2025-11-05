import { hashNode } from "./hashNode.js";

/**
 * Compute root hash of tree
 *
 * @param {import('./BrandedBinaryTree.js').BinaryTree} tree - Binary tree
 * @returns {Uint8Array} Root hash (32 bytes)
 *
 * @example
 * ```typescript
 * const tree = BinaryTree.init();
 * const hash = BinaryTree.rootHash(tree);
 * console.log(hash.every(b => b === 0)); // true (empty tree)
 * ```
 */
export function rootHash(tree) {
	return hashNode(tree.root);
}
