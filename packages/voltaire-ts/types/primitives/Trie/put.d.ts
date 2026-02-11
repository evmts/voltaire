/**
 * @typedef {{ hashNode: (node: import('./TrieType.js').TrieNode) => Uint8Array }} PutDeps
 */
/**
 * Factory: create a put function with injected hashing.
 *
 * @param {PutDeps} deps
 * @returns {(trie: import('./TrieType.js').Trie, key: Uint8Array, value: Uint8Array) => import('./TrieType.js').Trie}
 */
export function Put(deps: PutDeps): (trie: import("./TrieType.js").Trie, key: Uint8Array, value: Uint8Array) => import("./TrieType.js").Trie;
export type PutDeps = {
    hashNode: (node: import("./TrieType.js").TrieNode) => Uint8Array;
};
//# sourceMappingURL=put.d.ts.map