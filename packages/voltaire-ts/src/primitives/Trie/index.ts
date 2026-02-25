export * from "./errors.js";
export type {
	BranchNode,
	EmptyNode,
	ExtensionNode,
	LeafNode,
	Trie as TrieType,
	TrieNode,
	TrieProof,
} from "./TrieType.js";

import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import { decode as rlpDecode } from "../Rlp/decode.js";
import { encode as rlpEncode } from "../Rlp/encode.js";
import { clear as _clear } from "./clear.js";
import { EMPTY_ROOT_HASH as _EMPTY_ROOT_HASH } from "./constants.js";
import { Del as _Del } from "./del.js";
import {
	decodePath as _decodePath,
	encodePath as _encodePath,
} from "./encodePath.js";
import { get as _get } from "./get.js";
import { HashNode as _HashNode } from "./hashNode.js";
import { init as _init } from "./init.js";
import {
	commonPrefixLength as _commonPrefixLength,
	keyToNibbles as _keyToNibbles,
	nibblesToKey as _nibblesToKey,
} from "./nibbles.js";
import { Prove as _Prove } from "./prove.js";
import { Put as _Put } from "./put.js";
import { RootHash as _RootHash } from "./rootHash.js";
import type { TrieProof, Trie as TrieTypeInternal } from "./TrieType.js";
import { Verify as _Verify } from "./verify.js";

// biome-ignore lint/suspicious/noExplicitAny: RLP encode accepts arbitrary nested data structures
type RlpEncodeFn = (data: any) => Uint8Array;
// biome-ignore lint/suspicious/noExplicitAny: RLP decode returns arbitrary nested data structures
type RlpDecodeFn = (bytes: Uint8Array, stream?: boolean) => any;

type HashNodeDeps = {
	keccak256: (data: Uint8Array) => Uint8Array;
	rlpEncode: RlpEncodeFn;
};

// Export factories (tree-shakeable)
export const HashNode: (
	deps: HashNodeDeps,
) => (node: import("./TrieType.js").TrieNode) => Uint8Array = _HashNode;

export const Put: (deps: {
	hashNode: (node: import("./TrieType.js").TrieNode) => Uint8Array;
}) => (
	trie: TrieTypeInternal,
	key: Uint8Array,
	value: Uint8Array,
) => TrieTypeInternal = _Put;

export const Del: (deps: {
	hashNode: (node: import("./TrieType.js").TrieNode) => Uint8Array;
}) => (trie: TrieTypeInternal, key: Uint8Array) => TrieTypeInternal = _Del;

export const RootHash: (
	deps: HashNodeDeps,
) => (trie: TrieTypeInternal) => Uint8Array = _RootHash;

export const Prove: (deps: {
	rlpEncode: RlpEncodeFn;
}) => (trie: TrieTypeInternal, key: Uint8Array) => TrieProof = _Prove;

export const Verify: (deps: {
	keccak256: (data: Uint8Array) => Uint8Array;
	rlpDecode: RlpDecodeFn;
}) => (
	rootHash: Uint8Array,
	key: Uint8Array,
	proof: ReadonlyArray<Uint8Array>,
) => { value: Uint8Array | null; valid: boolean } = _Verify;

// Create wrappers with auto-injected crypto
const _hashNode = HashNode({ keccak256, rlpEncode });

export const hashNode: (node: import("./TrieType.js").TrieNode) => Uint8Array =
	_hashNode;

export const init: () => TrieTypeInternal = _init;

export const put: (
	trie: TrieTypeInternal,
	key: Uint8Array,
	value: Uint8Array,
) => TrieTypeInternal = _Put({ hashNode: _hashNode });

export const get: (
	trie: TrieTypeInternal,
	key: Uint8Array,
) => Uint8Array | null = _get;

export const del: (
	trie: TrieTypeInternal,
	key: Uint8Array,
) => TrieTypeInternal = _Del({ hashNode: _hashNode });

export const rootHash: (trie: TrieTypeInternal) => Uint8Array = _RootHash({
	keccak256,
	rlpEncode,
});

export const clear: (trie: TrieTypeInternal) => TrieTypeInternal = _clear;

export const prove: (trie: TrieTypeInternal, key: Uint8Array) => TrieProof =
	_Prove({ rlpEncode });

export const verify: (
	rootHash: Uint8Array,
	key: Uint8Array,
	proof: ReadonlyArray<Uint8Array>,
) => { value: Uint8Array | null; valid: boolean } = _Verify({
	keccak256,
	rlpDecode,
});

// Utility exports
export const EMPTY_ROOT_HASH: Uint8Array = _EMPTY_ROOT_HASH;
export const keyToNibbles: (key: Uint8Array) => Uint8Array = _keyToNibbles;
export const nibblesToKey: (nibbles: Uint8Array) => Uint8Array = _nibblesToKey;
export const commonPrefixLength: (a: Uint8Array, b: Uint8Array) => number =
	_commonPrefixLength;
export const encodePath: (nibbles: Uint8Array, isLeaf: boolean) => Uint8Array =
	_encodePath;
export const decodePath: (encoded: Uint8Array) => {
	nibbles: Uint8Array;
	isLeaf: boolean;
} = _decodePath;

// Namespace export
export const Trie = {
	init,
	put,
	get,
	del,
	rootHash,
	clear,
	prove,
	verify,
	hashNode,
	keyToNibbles,
	nibblesToKey,
	commonPrefixLength,
	encodePath,
	decodePath,
	EMPTY_ROOT_HASH,
};
