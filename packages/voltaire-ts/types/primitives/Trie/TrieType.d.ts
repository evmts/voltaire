/**
 * Merkle Patricia Trie — Ethereum's state trie data structure
 *
 * @see https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/
 */
export interface Trie {
    readonly nodes: Map<string, TrieNode>;
    readonly root: Uint8Array | null;
}
export type TrieNode = {
    readonly type: "empty";
} | {
    readonly type: "leaf";
    readonly nibbles: Uint8Array;
    readonly value: Uint8Array;
} | {
    readonly type: "extension";
    readonly nibbles: Uint8Array;
    readonly childHash: Uint8Array;
} | {
    readonly type: "branch";
    readonly children: ReadonlyArray<Uint8Array | null>;
    readonly value: Uint8Array | null;
};
export type LeafNode = Extract<TrieNode, {
    type: "leaf";
}>;
export type ExtensionNode = Extract<TrieNode, {
    type: "extension";
}>;
export type BranchNode = Extract<TrieNode, {
    type: "branch";
}>;
export type EmptyNode = Extract<TrieNode, {
    type: "empty";
}>;
export interface TrieProof {
    readonly key: Uint8Array;
    readonly value: Uint8Array | null;
    readonly proof: ReadonlyArray<Uint8Array>;
}
//# sourceMappingURL=TrieType.d.ts.map