/**
 * @typedef {{ keccak256: (data: Uint8Array) => Uint8Array; rlpEncode: (data: any) => Uint8Array }} RootHashDeps
 */
/**
 * Factory: create rootHash with injected crypto.
 *
 * @param {RootHashDeps} deps
 * @returns {(trie: import('./TrieType.js').Trie) => Uint8Array}
 */
export function RootHash(deps: RootHashDeps): (trie: import("./TrieType.js").Trie) => Uint8Array;
export type RootHashDeps = {
    keccak256: (data: Uint8Array) => Uint8Array;
    rlpEncode: (data: any) => Uint8Array;
};
//# sourceMappingURL=rootHash.d.ts.map