// @ts-nocheck
import * as BrandedBinaryTree from "./BrandedBinaryTree/index.js";

// Re-export BrandedBinaryTree errors
export * from "./BrandedBinaryTree/errors.js";

/**
 * @typedef {import('./BrandedBinaryTree/index.js').BinaryTree} BrandedBinaryTree
 * @typedef {import('./BrandedBinaryTree/index.js').Node} Node
 * @typedef {import('./BrandedBinaryTree/index.js').InternalNode} InternalNode
 * @typedef {import('./BrandedBinaryTree/index.js').StemNode} StemNode
 * @typedef {import('./BrandedBinaryTree/index.js').LeafNode} LeafNode
 * @typedef {import('./BrandedBinaryTree/index.js').EmptyNode} EmptyNode
 * @typedef {import('./BrandedBinaryTree/index.js').AccountData} AccountData
 */

/**
 * Factory function for creating BinaryTree instances
 *
 * Creates an empty binary tree
 *
 * @returns {BrandedBinaryTree} Empty binary tree
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
