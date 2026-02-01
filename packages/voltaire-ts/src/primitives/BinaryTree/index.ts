export type {
	AccountData,
	BinaryTree as BinaryTreeType,
	EmptyNode,
	InternalNode,
	LeafNode,
	Node,
	StemNode,
} from "./BinaryTreeType.js";
export * from "./errors.js";

import { blake3 } from "@noble/hashes/blake3.js";
import type { HexType } from "../Hex/index.js";
// Internal function imports
import { addressToKey as _addressToKey } from "./addressToKey.js";
import type {
	BinaryTree as BinaryTreeTypeInternal,
	LeafNode,
	Node,
	StemNode,
} from "./BinaryTreeType.js";
import { get as _get } from "./get.js";
import { getStemBit as _getStemBit } from "./getStemBit.js";
import { HashInternal as _HashInternal } from "./hashInternal.js";
import { HashLeaf as _HashLeaf } from "./hashLeaf.js";
import { HashNode as _HashNode } from "./hashNode.js";
import { HashStem as _HashStem } from "./hashStem.js";
import { init as _init } from "./init.js";
import { insert as _insert } from "./insert.js";
import { rootHash as _rootHash } from "./rootHash.js";
import { rootHashHex as _rootHashHex } from "./rootHashHex.js";
import { splitKey as _splitKey } from "./splitKey.js";

// Type definitions
type Blake3Deps = { blake3: (data: Uint8Array) => Uint8Array };

// Export factories (tree-shakeable)
export const HashInternal: (
	deps: Blake3Deps,
) => (l: Uint8Array, r: Uint8Array) => Uint8Array = _HashInternal;
export const HashStem: (deps: Blake3Deps) => (node: StemNode) => Uint8Array =
	_HashStem;
export const HashLeaf: (deps: Blake3Deps) => (node: LeafNode) => Uint8Array =
	_HashLeaf;
export const HashNode: (deps: Blake3Deps) => (node: Node) => Uint8Array =
	_HashNode;

// Create wrappers with auto-injected crypto
export const hashInternal: (l: Uint8Array, r: Uint8Array) => Uint8Array =
	HashInternal({ blake3 });
export const hashStem: (node: StemNode) => Uint8Array = HashStem({ blake3 });
export const hashLeaf: (node: LeafNode) => Uint8Array = HashLeaf({ blake3 });
export const hashNode: (node: Node) => Uint8Array = HashNode({ blake3 });

// Export other functions
export const addressToKey: (address: Uint8Array) => Uint8Array = _addressToKey;
export const splitKey: (key: Uint8Array) => { stem: Uint8Array; idx: number } =
	_splitKey;
export const getStemBit: (stem: Uint8Array, index: number) => 0 | 1 =
	_getStemBit;
export const init: () => BinaryTreeTypeInternal = _init;
export const insert = _insert as (
	tree: BinaryTreeTypeInternal,
	key: Uint8Array,
	value: Uint8Array,
) => BinaryTreeTypeInternal;
export const get: (
	tree: BinaryTreeTypeInternal,
	key: Uint8Array,
) => Uint8Array | null = _get;
export const rootHash: (tree: BinaryTreeTypeInternal) => Uint8Array = _rootHash;
export const rootHashHex: (tree: BinaryTreeTypeInternal) => HexType =
	_rootHashHex;

// Namespace export
export const BinaryTree = {
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
