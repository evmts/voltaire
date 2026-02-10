/**
 * Create an empty Merkle Patricia Trie.
 *
 * @returns {import('./TrieType.js').Trie}
 */
export function init() {
	return { nodes: new Map(), root: null };
}
