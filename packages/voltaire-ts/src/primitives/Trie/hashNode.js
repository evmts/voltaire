import { encodePath } from "./encodePath.js";

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
export function HashNode(deps) {
	const { keccak256, rlpEncode } = deps;

	/**
	 * @param {import('./TrieType.js').TrieNode} node
	 * @returns {Uint8Array}
	 */
	return function hashNode(node) {
		const encoded = encodeNode(node, rlpEncode);
		if (encoded.length < 32) return encoded;
		return keccak256(encoded);
	};
}

/**
 * RLP-encode a trie node to its serialized form.
 *
 * @param {import('./TrieType.js').TrieNode} node
 * @param {(data: any) => Uint8Array} rlpEncode
 * @returns {Uint8Array}
 */
export function encodeNode(node, rlpEncode) {
	switch (node.type) {
		case "empty":
			return rlpEncode(new Uint8Array([]));
		case "leaf":
			return rlpEncode([
				encodePath(node.nibbles, true),
				node.value,
			]);
		case "extension":
			return rlpEncode([
				encodePath(node.nibbles, false),
				node.childHash,
			]);
		case "branch": {
			/** @type {(Uint8Array | Uint8Array)[]} */
			const items = [];
			for (let i = 0; i < 16; i++) {
				items.push(node.children[i] || new Uint8Array([]));
			}
			items.push(node.value || new Uint8Array([]));
			return rlpEncode(items);
		}
	}
}
