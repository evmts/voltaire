/**
 * Reset a trie to empty state.
 *
 * @param {import('./TrieType.js').Trie} _trie - ignored, returns fresh empty trie
 * @returns {import('./TrieType.js').Trie}
 */
export function clear(_trie) {
	return { nodes: new Map(), root: null };
}
