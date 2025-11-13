import { HashNode } from "./hashNode.js";
import { blake3 } from "@noble/hashes/blake3.js";

const hashNode = HashNode({ blake3 });

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
