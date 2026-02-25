import { encodeNode } from "./hashNode.js";
import { commonPrefixLength, keyToNibbles } from "./nibbles.js";

/**
 * @typedef {{ rlpEncode: (data: any) => Uint8Array }} ProveDeps
 */

/**
 * Factory: create a prove function with injected deps.
 *
 * @param {ProveDeps} deps
 * @returns {(trie: import('./TrieType.js').Trie, key: Uint8Array) => import('./TrieType.js').TrieProof}
 */
export function Prove(deps) {
	const { rlpEncode } = deps;

	/**
	 * Generate a Merkle proof for a key.
	 * The proof consists of RLP-encoded nodes along the path from root to key.
	 *
	 * @param {import('./TrieType.js').Trie} trie
	 * @param {Uint8Array} key
	 * @returns {import('./TrieType.js').TrieProof}
	 */
	return function prove(trie, key) {
		const nibbles = keyToNibbles(key);
		/** @type {Uint8Array[]} */
		const proof = [];

		collectProof(trie.nodes, trie.root, nibbles, proof, rlpEncode);
		const value = findValue(trie.nodes, trie.root, nibbles);

		return { key, value, proof };
	};
}

/**
 * @param {Map<string, import('./TrieType.js').TrieNode>} nodes
 * @param {Uint8Array | null} nodeHash
 * @param {Uint8Array} nibbles
 * @param {Uint8Array[]} proof
 * @param {(data: any) => Uint8Array} rlpEncode
 * @returns {void}
 */
function collectProof(nodes, nodeHash, nibbles, proof, rlpEncode) {
	if (nodeHash === null) return;

	const node = nodes.get(toHex(nodeHash));
	if (!node) return;

	const encoded = encodeNode(node, rlpEncode);
	proof.push(encoded);

	switch (node.type) {
		case "empty":
			break;

		case "leaf":
			break;

		case "extension": {
			const prefixLen = commonPrefixLength(nibbles, node.nibbles);
			if (prefixLen === node.nibbles.length) {
				collectProof(
					nodes,
					node.childHash,
					nibbles.subarray(prefixLen),
					proof,
					rlpEncode,
				);
			}
			break;
		}

		case "branch": {
			if (nibbles.length > 0) {
				const idx = /** @type {number} */ (nibbles[0]);
				const child = node.children[idx];
				if (child) {
					collectProof(nodes, child, nibbles.subarray(1), proof, rlpEncode);
				}
			}
			break;
		}
	}
}

/**
 * @param {Map<string, import('./TrieType.js').TrieNode>} nodes
 * @param {Uint8Array | null} nodeHash
 * @param {Uint8Array} nibbles
 * @returns {Uint8Array | null}
 */
function findValue(nodes, nodeHash, nibbles) {
	if (nodeHash === null) return null;
	const node = nodes.get(toHex(nodeHash));
	if (!node) return null;

	switch (node.type) {
		case "empty":
			return null;
		case "leaf":
			if (
				nibbles.length === node.nibbles.length &&
				commonPrefixLength(nibbles, node.nibbles) === nibbles.length
			) {
				return node.value;
			}
			return null;
		case "extension": {
			const prefixLen = commonPrefixLength(nibbles, node.nibbles);
			if (prefixLen !== node.nibbles.length) return null;
			return findValue(nodes, node.childHash, nibbles.subarray(prefixLen));
		}
		case "branch": {
			if (nibbles.length === 0) return node.value;
			const idx = /** @type {number} */ (nibbles[0]);
			if (!node.children[idx]) return null;
			return findValue(nodes, node.children[idx] ?? null, nibbles.subarray(1));
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
