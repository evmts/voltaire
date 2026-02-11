import { commonPrefixLength, keyToNibbles } from "./nibbles.js";

/**
 * @typedef {{ hashNode: (node: import('./TrieType.js').TrieNode) => Uint8Array }} DelDeps
 */

/**
 * Factory: create a del function with injected hashing.
 *
 * @param {DelDeps} deps
 * @returns {(trie: import('./TrieType.js').Trie, key: Uint8Array) => import('./TrieType.js').Trie}
 */
export function Del(deps) {
	const { hashNode } = deps;

	/**
	 * @param {Map<string, import('./TrieType.js').TrieNode>} nodes
	 * @param {import('./TrieType.js').TrieNode} node
	 * @returns {Uint8Array}
	 */
	function storeNode(nodes, node) {
		const hash = hashNode(node);
		const key = toHex(hash);
		nodes.set(key, node);
		return hash;
	}

	/**
	 * Delete from subtree. Returns new root hash or null if subtree is empty.
	 *
	 * @param {Map<string, import('./TrieType.js').TrieNode>} nodes
	 * @param {Uint8Array | null} nodeHash
	 * @param {Uint8Array} nibbles
	 * @returns {Uint8Array | null}
	 */
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: inherently complex algorithm
	function deleteAt(nodes, nodeHash, nibbles) {
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
					return null;
				}
				return nodeHash;
			}

			case "extension": {
				const extNibbles = node.nibbles;
				if (nibbles.length < extNibbles.length) return nodeHash;
				const prefixLen = commonPrefixLength(nibbles, extNibbles);
				if (prefixLen !== extNibbles.length) return nodeHash;

				const newChildHash = deleteAt(
					nodes,
					node.childHash,
					nibbles.subarray(prefixLen),
				);
				if (newChildHash === null) return null;

				const child = nodes.get(toHex(newChildHash));
				if (child) {
					if (child.type === "leaf") {
						const merged = new Uint8Array(
							extNibbles.length + child.nibbles.length,
						);
						merged.set(extNibbles);
						merged.set(child.nibbles, extNibbles.length);
						return storeNode(nodes, {
							type: "leaf",
							nibbles: merged,
							value: child.value,
						});
					}
					if (child.type === "extension") {
						const merged = new Uint8Array(
							extNibbles.length + child.nibbles.length,
						);
						merged.set(extNibbles);
						merged.set(child.nibbles, extNibbles.length);
						return storeNode(nodes, {
							type: "extension",
							nibbles: merged,
							childHash: child.childHash,
						});
					}
				}

				return storeNode(nodes, {
					type: "extension",
					nibbles: extNibbles,
					childHash: newChildHash,
				});
			}

			case "branch": {
				const children = [...node.children];
				/** @type {Uint8Array | null} */
				let branchValue = node.value;

				if (nibbles.length === 0) {
					branchValue = null;
				} else {
					const idx = /** @type {number} */ (nibbles[0]);
					if (!children[idx]) return nodeHash;
					children[idx] = deleteAt(nodes, children[idx], nibbles.subarray(1));
				}

				let remaining = 0;
				let lastIdx = -1;
				for (let i = 0; i < 16; i++) {
					if (children[i] !== null) {
						remaining++;
						lastIdx = i;
					}
				}
				const hasValue = branchValue !== null;

				if (remaining === 0 && !hasValue) return null;

				if (remaining === 0 && hasValue) {
					return storeNode(nodes, {
						type: "leaf",
						nibbles: new Uint8Array([]),
						value: /** @type {Uint8Array} */ (branchValue),
					});
				}

				if (remaining === 1 && !hasValue) {
					const childHash = /** @type {Uint8Array} */ (children[lastIdx]);
					const child = nodes.get(toHex(childHash));

					if (child) {
						if (child.type === "leaf") {
							const merged = new Uint8Array(1 + child.nibbles.length);
							merged[0] = lastIdx;
							merged.set(child.nibbles, 1);
							return storeNode(nodes, {
								type: "leaf",
								nibbles: merged,
								value: child.value,
							});
						}
						if (child.type === "extension") {
							const merged = new Uint8Array(1 + child.nibbles.length);
							merged[0] = lastIdx;
							merged.set(child.nibbles, 1);
							return storeNode(nodes, {
								type: "extension",
								nibbles: merged,
								childHash: child.childHash,
							});
						}
					}

					return storeNode(nodes, {
						type: "extension",
						nibbles: new Uint8Array([lastIdx]),
						childHash: childHash,
					});
				}

				return storeNode(nodes, {
					type: "branch",
					children,
					value: branchValue,
				});
			}
		}
	}

	/**
	 * Delete a key from the trie. Returns a new Trie (immutable).
	 *
	 * @param {import('./TrieType.js').Trie} trie
	 * @param {Uint8Array} key
	 * @returns {import('./TrieType.js').Trie}
	 */
	return function del(trie, key) {
		const nodes = new Map(trie.nodes);
		const nibbles = keyToNibbles(key);
		const root = deleteAt(nodes, trie.root, nibbles);
		return { nodes, root };
	};
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
