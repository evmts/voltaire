export * from "./errors.js";
import { blake3 } from "@noble/hashes/blake3.js";
// Internal function imports
import { addressToKey as _addressToKey } from "./addressToKey.js";
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
// Export factories (tree-shakeable)
export const HashInternal = _HashInternal;
export const HashStem = _HashStem;
export const HashLeaf = _HashLeaf;
export const HashNode = _HashNode;
// Create wrappers with auto-injected crypto
export const hashInternal = HashInternal({ blake3 });
export const hashStem = HashStem({ blake3 });
export const hashLeaf = HashLeaf({ blake3 });
export const hashNode = HashNode({ blake3 });
// Export other functions
export const addressToKey = _addressToKey;
export const splitKey = _splitKey;
export const getStemBit = _getStemBit;
export const init = _init;
export const insert = _insert;
export const get = _get;
export const rootHash = _rootHash;
export const rootHashHex = _rootHashHex;
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
