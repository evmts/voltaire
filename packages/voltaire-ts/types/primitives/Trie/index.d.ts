export * from "./errors.js";
export type { BranchNode, EmptyNode, ExtensionNode, LeafNode, Trie as TrieType, TrieNode, TrieProof, } from "./TrieType.js";
import type { TrieProof, Trie as TrieTypeInternal } from "./TrieType.js";
type RlpEncodeFn = (data: any) => Uint8Array;
type RlpDecodeFn = (bytes: Uint8Array, stream?: boolean) => any;
type HashNodeDeps = {
    keccak256: (data: Uint8Array) => Uint8Array;
    rlpEncode: RlpEncodeFn;
};
export declare const HashNode: (deps: HashNodeDeps) => (node: import("./TrieType.js").TrieNode) => Uint8Array;
export declare const Put: (deps: {
    hashNode: (node: import("./TrieType.js").TrieNode) => Uint8Array;
}) => (trie: TrieTypeInternal, key: Uint8Array, value: Uint8Array) => TrieTypeInternal;
export declare const Del: (deps: {
    hashNode: (node: import("./TrieType.js").TrieNode) => Uint8Array;
}) => (trie: TrieTypeInternal, key: Uint8Array) => TrieTypeInternal;
export declare const RootHash: (deps: HashNodeDeps) => (trie: TrieTypeInternal) => Uint8Array;
export declare const Prove: (deps: {
    rlpEncode: RlpEncodeFn;
}) => (trie: TrieTypeInternal, key: Uint8Array) => TrieProof;
export declare const Verify: (deps: {
    keccak256: (data: Uint8Array) => Uint8Array;
    rlpDecode: RlpDecodeFn;
}) => (rootHash: Uint8Array, key: Uint8Array, proof: ReadonlyArray<Uint8Array>) => {
    value: Uint8Array | null;
    valid: boolean;
};
export declare const hashNode: (node: import("./TrieType.js").TrieNode) => Uint8Array;
export declare const init: () => TrieTypeInternal;
export declare const put: (trie: TrieTypeInternal, key: Uint8Array, value: Uint8Array) => TrieTypeInternal;
export declare const get: (trie: TrieTypeInternal, key: Uint8Array) => Uint8Array | null;
export declare const del: (trie: TrieTypeInternal, key: Uint8Array) => TrieTypeInternal;
export declare const rootHash: (trie: TrieTypeInternal) => Uint8Array;
export declare const clear: (trie: TrieTypeInternal) => TrieTypeInternal;
export declare const prove: (trie: TrieTypeInternal, key: Uint8Array) => TrieProof;
export declare const verify: (rootHash: Uint8Array, key: Uint8Array, proof: ReadonlyArray<Uint8Array>) => {
    value: Uint8Array | null;
    valid: boolean;
};
export declare const EMPTY_ROOT_HASH: Uint8Array;
export declare const keyToNibbles: (key: Uint8Array) => Uint8Array;
export declare const nibblesToKey: (nibbles: Uint8Array) => Uint8Array;
export declare const commonPrefixLength: (a: Uint8Array, b: Uint8Array) => number;
export declare const encodePath: (nibbles: Uint8Array, isLeaf: boolean) => Uint8Array;
export declare const decodePath: (encoded: Uint8Array) => {
    nibbles: Uint8Array;
    isLeaf: boolean;
};
export declare const Trie: {
    init: () => TrieTypeInternal;
    put: (trie: TrieTypeInternal, key: Uint8Array, value: Uint8Array) => TrieTypeInternal;
    get: (trie: TrieTypeInternal, key: Uint8Array) => Uint8Array | null;
    del: (trie: TrieTypeInternal, key: Uint8Array) => TrieTypeInternal;
    rootHash: (trie: TrieTypeInternal) => Uint8Array;
    clear: (trie: TrieTypeInternal) => TrieTypeInternal;
    prove: (trie: TrieTypeInternal, key: Uint8Array) => TrieProof;
    verify: (rootHash: Uint8Array, key: Uint8Array, proof: ReadonlyArray<Uint8Array>) => {
        value: Uint8Array | null;
        valid: boolean;
    };
    hashNode: (node: import("./TrieType.js").TrieNode) => Uint8Array;
    keyToNibbles: (key: Uint8Array) => Uint8Array;
    nibblesToKey: (nibbles: Uint8Array) => Uint8Array;
    commonPrefixLength: (a: Uint8Array, b: Uint8Array) => number;
    encodePath: (nibbles: Uint8Array, isLeaf: boolean) => Uint8Array;
    decodePath: (encoded: Uint8Array) => {
        nibbles: Uint8Array;
        isLeaf: boolean;
    };
    EMPTY_ROOT_HASH: Uint8Array<ArrayBufferLike>;
};
//# sourceMappingURL=index.d.ts.map