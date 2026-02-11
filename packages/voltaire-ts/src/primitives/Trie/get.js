import { commonPrefixLength, keyToNibbles } from "./nibbles.js";

/**
 * Look up a value in the trie by key.
 *
 * @param {import('./TrieType.js').Trie} trie
 * @param {Uint8Array} key
 * @returns {Uint8Array | null}
 */
export function get(trie, key) {
	const nibbles = keyToNibbles(key);
	return lookupAt(trie.nodes, trie.root, nibbles);
}

/**
 * @param {Map<string, import('./TrieType.js').TrieNode>} nodes
 * @param {Uint8Array | null} nodeHash
 * @param {Uint8Array} nibbles
 * @returns {Uint8Array | null}
 */
function lookupAt(nodes, nodeHash, nibbles) {
	if (nodeHash === null) return null;

	const node = nodes.get(toHex(nodeHash));
	if (!node) return null;

	switch (node.type) {
		case "empty":
			return null;

		case "leaf": {
			if (
				nibbles.length === node.nibbles.length &&
				commonPrefixLength(nibbles, node.nibbles) === nibbles.length
			) {
				return node.value;
			}
			return null;
		}

		case "extension": {
			const extNibbles = node.nibbles;
			if (nibbles.length < extNibbles.length) return null;
			const prefixLen = commonPrefixLength(nibbles, extNibbles);
			if (prefixLen !== extNibbles.length) return null;
			return lookupAt(nodes, node.childHash, nibbles.subarray(prefixLen));
		}

		case "branch": {
			if (nibbles.length === 0) return node.value;
			const idx = /** @type {number} */ (nibbles[0]);
			const child = node.children[idx];
			if (!child) return null;
			return lookupAt(nodes, child, nibbles.subarray(1));
		}
	}
}

/**
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function toHex(bytes) {
	let hex = "";
	for (let i = 0; i < bytes.length; i++) {
		hex += /** @type {number} */ (bytes[i])
			.toString(16)
			.padStart(2, "0");
	}
	return hex;
}
