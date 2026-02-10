import { EMPTY_ROOT_HASH } from "./constants.js";

/**
 * @typedef {{ keccak256: (data: Uint8Array) => Uint8Array; rlpEncode: (data: any) => Uint8Array }} RootHashDeps
 */

/**
 * Factory: create rootHash with injected crypto.
 *
 * @param {RootHashDeps} deps
 * @returns {(trie: import('./TrieType.js').Trie) => Uint8Array}
 */
export function RootHash(deps) {
	const { keccak256, rlpEncode } = deps;

	/**
	 * Compute the 32-byte root hash of the trie.
	 * Returns EMPTY_ROOT_HASH (keccak256 of RLP("")) for empty tries.
	 *
	 * @param {import('./TrieType.js').Trie} trie
	 * @returns {Uint8Array}
	 */
	return function rootHash(trie) {
		if (trie.root === null) return EMPTY_ROOT_HASH;

		// If root is already 32 bytes (a keccak hash), return it
		if (trie.root.length === 32) return trie.root;

		// Root is an inline RLP node (< 32 bytes) — hash it
		return keccak256(trie.root);
	};
}
