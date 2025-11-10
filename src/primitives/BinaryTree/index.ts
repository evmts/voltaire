import * as BrandedBinaryTree from "./BrandedBinaryTree/index.js";

// Re-export BrandedBinaryTree errors
export * from "./BrandedBinaryTree/errors.js";

// Re-export types
export type {
	BinaryTree as BrandedBinaryTree,
	Node,
	InternalNode,
	StemNode,
	LeafNode,
	EmptyNode,
	AccountData,
} from "./BrandedBinaryTree/index.js";

/**
 * Factory function for creating BinaryTree instances
 *
 * Creates an empty binary tree
 *
 * @returns Empty binary tree
 *
 * @example
 * ```typescript
 * const tree = BinaryTree();
 * console.log(tree.root.type); // 'empty'
 * ```
 */
export function BinaryTree() {
	return BrandedBinaryTree.init();
}

// Static methods
BinaryTree.init = BrandedBinaryTree.init;
BinaryTree.insert = BrandedBinaryTree.insert;
BinaryTree.get = BrandedBinaryTree.get;
BinaryTree.rootHash = BrandedBinaryTree.rootHash;
BinaryTree.rootHashHex = BrandedBinaryTree.rootHashHex;
BinaryTree.addressToKey = BrandedBinaryTree.addressToKey;
BinaryTree.splitKey = BrandedBinaryTree.splitKey;
BinaryTree.getStemBit = BrandedBinaryTree.getStemBit;
BinaryTree.hashInternal = BrandedBinaryTree.hashInternal;
BinaryTree.hashStem = BrandedBinaryTree.hashStem;
BinaryTree.hashLeaf = BrandedBinaryTree.hashLeaf;
BinaryTree.hashNode = BrandedBinaryTree.hashNode;
