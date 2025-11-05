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
