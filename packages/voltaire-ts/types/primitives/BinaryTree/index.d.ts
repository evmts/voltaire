export type { AccountData, BinaryTree as BinaryTreeType, EmptyNode, InternalNode, LeafNode, Node, StemNode, } from "./BinaryTreeType.js";
export * from "./errors.js";
import type { HexType } from "../Hex/index.js";
import type { BinaryTree as BinaryTreeTypeInternal, LeafNode, Node, StemNode } from "./BinaryTreeType.js";
type Blake3Deps = {
    blake3: (data: Uint8Array) => Uint8Array;
};
export declare const HashInternal: (deps: Blake3Deps) => (l: Uint8Array, r: Uint8Array) => Uint8Array;
export declare const HashStem: (deps: Blake3Deps) => (node: StemNode) => Uint8Array;
export declare const HashLeaf: (deps: Blake3Deps) => (node: LeafNode) => Uint8Array;
export declare const HashNode: (deps: Blake3Deps) => (node: Node) => Uint8Array;
export declare const hashInternal: (l: Uint8Array, r: Uint8Array) => Uint8Array;
export declare const hashStem: (node: StemNode) => Uint8Array;
export declare const hashLeaf: (node: LeafNode) => Uint8Array;
export declare const hashNode: (node: Node) => Uint8Array;
export declare const addressToKey: (address: Uint8Array) => Uint8Array;
export declare const splitKey: (key: Uint8Array) => {
    stem: Uint8Array;
    idx: number;
};
export declare const getStemBit: (stem: Uint8Array, index: number) => 0 | 1;
export declare const init: () => BinaryTreeTypeInternal;
export declare const insert: (tree: BinaryTreeTypeInternal, key: Uint8Array, value: Uint8Array) => BinaryTreeTypeInternal;
export declare const get: (tree: BinaryTreeTypeInternal, key: Uint8Array) => Uint8Array | null;
export declare const rootHash: (tree: BinaryTreeTypeInternal) => Uint8Array;
export declare const rootHashHex: (tree: BinaryTreeTypeInternal) => HexType;
export declare const BinaryTree: {
    addressToKey: (address: Uint8Array) => Uint8Array;
    splitKey: (key: Uint8Array) => {
        stem: Uint8Array;
        idx: number;
    };
    getStemBit: (stem: Uint8Array, index: number) => 0 | 1;
    hashInternal: (l: Uint8Array, r: Uint8Array) => Uint8Array;
    hashStem: (node: StemNode) => Uint8Array;
    hashLeaf: (node: LeafNode) => Uint8Array;
    hashNode: (node: Node) => Uint8Array;
    init: () => BinaryTreeTypeInternal;
    insert: (tree: BinaryTreeTypeInternal, key: Uint8Array, value: Uint8Array) => BinaryTreeTypeInternal;
    get: (tree: BinaryTreeTypeInternal, key: Uint8Array) => Uint8Array | null;
    rootHash: (tree: BinaryTreeTypeInternal) => Uint8Array;
    rootHashHex: (tree: BinaryTreeTypeInternal) => HexType;
};
//# sourceMappingURL=index.d.ts.map