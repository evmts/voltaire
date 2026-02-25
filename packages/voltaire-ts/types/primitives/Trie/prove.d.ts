/**
 * @typedef {{ rlpEncode: (data: any) => Uint8Array }} ProveDeps
 */
/**
 * Factory: create a prove function with injected deps.
 *
 * @param {ProveDeps} deps
 * @returns {(trie: import('./TrieType.js').Trie, key: Uint8Array) => import('./TrieType.js').TrieProof}
 */
export function Prove(deps: ProveDeps): (trie: import("./TrieType.js").Trie, key: Uint8Array) => import("./TrieType.js").TrieProof;
export type ProveDeps = {
    rlpEncode: (data: any) => Uint8Array;
};
//# sourceMappingURL=prove.d.ts.map