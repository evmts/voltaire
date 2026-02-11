/**
 * @typedef {{ hashNode: (node: import('./TrieType.js').TrieNode) => Uint8Array }} DelDeps
 */
/**
 * Factory: create a del function with injected hashing.
 *
 * @param {DelDeps} deps
 * @returns {(trie: import('./TrieType.js').Trie, key: Uint8Array) => import('./TrieType.js').Trie}
 */
export function Del(deps: DelDeps): (trie: import("./TrieType.js").Trie, key: Uint8Array) => import("./TrieType.js").Trie;
export type DelDeps = {
    hashNode: (node: import("./TrieType.js").TrieNode) => Uint8Array;
};
//# sourceMappingURL=del.d.ts.map