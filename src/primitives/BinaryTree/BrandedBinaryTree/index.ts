// @ts-nocheck
export * from "./errors.js";
export * from "./BrandedBinaryTree.js";

import { blake3 } from "@noble/hashes/blake3.js";
import { addressToKey } from "./addressToKey.js";
import { get } from "./get.js";
import { getStemBit } from "./getStemBit.js";
import { HashInternal } from "./hashInternal.js";
import { HashLeaf } from "./hashLeaf.js";
import { HashNode } from "./hashNode.js";
import { HashStem } from "./hashStem.js";
import { init } from "./init.js";
import { insert } from "./insert.js";
import { rootHash } from "./rootHash.js";
import { rootHashHex } from "./rootHashHex.js";
import { splitKey } from "./splitKey.js";

// Export factories (tree-shakeable)
export { HashInternal, HashStem, HashLeaf, HashNode };

// Create wrappers with auto-injected crypto
export const hashInternal = HashInternal({ blake3 });
export const hashStem = HashStem({ blake3 });
export const hashLeaf = HashLeaf({ blake3 });
export const hashNode = HashNode({ blake3 });

// Export other functions
export {
	addressToKey,
	splitKey,
	getStemBit,
	init,
	insert,
	get,
	rootHash,
	rootHashHex,
};

// Namespace export
export const BrandedBinaryTree = {
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
