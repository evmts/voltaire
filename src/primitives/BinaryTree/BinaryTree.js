// @ts-nocheck
export * from "./errors.js";
export * from "./BrandedBinaryTree.js";

import { addressToKey } from "./addressToKey.js";
import { get } from "./get.js";
import { getStemBit } from "./getStemBit.js";
import { hashInternal } from "./hashInternal.js";
import { hashLeaf } from "./hashLeaf.js";
import { hashNode } from "./hashNode.js";
import { hashStem } from "./hashStem.js";
import { init } from "./init.js";
import { insert } from "./insert.js";
import { rootHash } from "./rootHash.js";
import { rootHashHex } from "./rootHashHex.js";
import { splitKey } from "./splitKey.js";

// Export individual functions
export {
	addressToKey,
	splitKey,
	getStemBit,
	hashInternal,
	hashStem,
	hashLeaf,
	hashNode,
	init,
	insert,
	get,
	rootHash,
	rootHashHex,
};

/**
 * @typedef {import('./BrandedBinaryTree.js').BinaryTree} BrandedBinaryTree
 * @typedef {import('./BrandedBinaryTree.js').Node} Node
 * @typedef {import('./BrandedBinaryTree.js').InternalNode} InternalNode
 * @typedef {import('./BrandedBinaryTree.js').StemNode} StemNode
 * @typedef {import('./BrandedBinaryTree.js').LeafNode} LeafNode
 * @typedef {import('./BrandedBinaryTree.js').EmptyNode} EmptyNode
 * @typedef {import('./BrandedBinaryTree.js').AccountData} AccountData
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
	return init();
}

BinaryTree.init = init;
BinaryTree.insert = insert;
BinaryTree.get = get;
BinaryTree.rootHash = rootHash;
BinaryTree.rootHashHex = rootHashHex;
BinaryTree.addressToKey = addressToKey;
BinaryTree.splitKey = splitKey;
BinaryTree.getStemBit = getStemBit;
BinaryTree.hashInternal = hashInternal;
BinaryTree.hashStem = hashStem;
BinaryTree.hashLeaf = hashLeaf;
BinaryTree.hashNode = hashNode;
