import { commonPrefixLength, keyToNibbles } from "./nibbles.js";

/**
 * @typedef {{ hashNode: (node: import('./TrieType.js').TrieNode) => Uint8Array }} PutDeps
 */

/**
 * Factory: create a put function with injected hashing.
 *
 * @param {PutDeps} deps
 * @returns {(trie: import('./TrieType.js').Trie, key: Uint8Array, value: Uint8Array) => import('./TrieType.js').Trie}
 */
export function Put(deps) {
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
	 * Insert into subtree rooted at the given hash. Returns new root hash.
	 *
	 * @param {Map<string, import('./TrieType.js').TrieNode>} nodes
	 * @param {Uint8Array | null} nodeHash
	 * @param {Uint8Array} nibbles - remaining nibbles of the key
	 * @param {Uint8Array} value
	 * @returns {Uint8Array}
	 */
	function insertAt(nodes, nodeHash, nibbles, value) {
		if (nodeHash === null) {
			return storeNode(nodes, { type: "leaf", nibbles, value });
		}

		const node = nodes.get(toHex(nodeHash));
		if (!node) {
			return storeNode(nodes, { type: "leaf", nibbles, value });
		}

		switch (node.type) {
			case "empty":
				return storeNode(nodes, { type: "leaf", nibbles, value });

			case "leaf": {
				const existingNibbles = node.nibbles;
				const existingValue = node.value;

				if (
					nibbles.length === existingNibbles.length &&
					commonPrefixLength(nibbles, existingNibbles) === nibbles.length
				) {
					return storeNode(nodes, { type: "leaf", nibbles, value });
				}

				const prefixLen = commonPrefixLength(nibbles, existingNibbles);
				const branchHash = createBranchFromTwo(
					nodes,
					existingNibbles.subarray(prefixLen),
					existingValue,
					nibbles.subarray(prefixLen),
					value,
				);

				if (prefixLen === 0) return branchHash;
				return storeNode(nodes, {
					type: "extension",
					nibbles: nibbles.subarray(0, prefixLen),
					childHash: branchHash,
				});
			}

			case "extension": {
				const extNibbles = node.nibbles;
				const prefixLen = commonPrefixLength(nibbles, extNibbles);

				if (prefixLen === extNibbles.length) {
					const newChildHash = insertAt(
						nodes,
						node.childHash,
						nibbles.subarray(prefixLen),
						value,
					);
					return storeNode(nodes, {
						type: "extension",
						nibbles: extNibbles,
						childHash: newChildHash,
					});
				}

				const remainingExt = extNibbles.subarray(prefixLen);
				const remainingKey = nibbles.subarray(prefixLen);

				/** @type {(Uint8Array | null)[]} */
				const children = new Array(16).fill(null);
				/** @type {Uint8Array | null} */
				let branchValue = null;

				const extIdx = /** @type {number} */ (remainingExt[0]);
				if (remainingExt.length === 1) {
					children[extIdx] = node.childHash;
				} else {
					const shorterExt = storeNode(nodes, {
						type: "extension",
						nibbles: remainingExt.subarray(1),
						childHash: node.childHash,
					});
					children[extIdx] = shorterExt;
				}

				if (remainingKey.length === 0) {
					branchValue = value;
				} else {
					const keyIdx = /** @type {number} */ (remainingKey[0]);
					if (remainingKey.length === 1) {
						children[keyIdx] = storeNode(nodes, {
							type: "leaf",
							nibbles: new Uint8Array([]),
							value,
						});
					} else {
						children[keyIdx] = storeNode(nodes, {
							type: "leaf",
							nibbles: remainingKey.subarray(1),
							value,
						});
					}
				}

				const branchHash = storeNode(nodes, {
					type: "branch",
					children,
					value: branchValue,
				});

				if (prefixLen === 0) return branchHash;
				return storeNode(nodes, {
					type: "extension",
					nibbles: nibbles.subarray(0, prefixLen),
					childHash: branchHash,
				});
			}

			case "branch": {
				const children = [...node.children];
				if (nibbles.length === 0) {
					return storeNode(nodes, {
						type: "branch",
						children,
						value,
					});
				}
				const idx = /** @type {number} */ (nibbles[0]);
				children[idx] = insertAt(
					nodes,
					node.children[idx] || null,
					nibbles.subarray(1),
					value,
				);
				return storeNode(nodes, {
					type: "branch",
					children,
					value: node.value,
				});
			}
		}
	}

	/**
	 * Create a branch node from two leaf entries.
	 *
	 * @param {Map<string, import('./TrieType.js').TrieNode>} nodes
	 * @param {Uint8Array} nibblesA
	 * @param {Uint8Array} valueA
	 * @param {Uint8Array} nibblesB
	 * @param {Uint8Array} valueB
	 * @returns {Uint8Array}
	 */
	function createBranchFromTwo(nodes, nibblesA, valueA, nibblesB, valueB) {
		/** @type {(Uint8Array | null)[]} */
		const children = new Array(16).fill(null);
		/** @type {Uint8Array | null} */
		let branchValue = null;

		if (nibblesA.length === 0) {
			branchValue = valueA;
		} else {
			const idxA = /** @type {number} */ (nibblesA[0]);
			children[idxA] = storeNode(nodes, {
				type: "leaf",
				nibbles: nibblesA.subarray(1),
				value: valueA,
			});
		}

		if (nibblesB.length === 0) {
			branchValue = valueB;
		} else {
			const idxB = /** @type {number} */ (nibblesB[0]);
			children[idxB] = storeNode(nodes, {
				type: "leaf",
				nibbles: nibblesB.subarray(1),
				value: valueB,
			});
		}

		return storeNode(nodes, { type: "branch", children, value: branchValue });
	}

	/**
	 * Insert a key-value pair into the trie. Returns a new Trie (immutable).
	 *
	 * @param {import('./TrieType.js').Trie} trie
	 * @param {Uint8Array} key
	 * @param {Uint8Array} value
	 * @returns {import('./TrieType.js').Trie}
	 */
	return function put(trie, key, value) {
		const nodes = new Map(trie.nodes);
		const nibbles = keyToNibbles(key);
		const root = insertAt(nodes, trie.root, nibbles, value);
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
		hex += /** @type {number} */ (bytes[i]).toString(16).padStart(2, "0");
	}
	return hex;
}
