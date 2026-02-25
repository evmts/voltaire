/**
 * @typedef {{ keccak256: (data: Uint8Array) => Uint8Array; rlpEncode: (data: any) => Uint8Array }} HashNodeDeps
 */
/**
 * Factory: create a node hashing function with injected crypto deps.
 *
 * RLP-encodes a trie node, then keccak256 hashes it if >= 32 bytes.
 * Nodes < 32 bytes are stored inline (returned as-is RLP).
 *
 * @param {HashNodeDeps} deps
 * @returns {(node: import('./TrieType.js').TrieNode) => Uint8Array}
 */
export function HashNode(deps: HashNodeDeps): (node: import("./TrieType.js").TrieNode) => Uint8Array;
/**
 * RLP-encode a trie node to its serialized form.
 *
 * @param {import('./TrieType.js').TrieNode} node
 * @param {(data: any) => Uint8Array} rlpEncode
 * @returns {Uint8Array}
 */
export function encodeNode(node: import("./TrieType.js").TrieNode, rlpEncode: (data: any) => Uint8Array): Uint8Array;
export type HashNodeDeps = {
    keccak256: (data: Uint8Array) => Uint8Array;
    rlpEncode: (data: any) => Uint8Array;
};
//# sourceMappingURL=hashNode.d.ts.map