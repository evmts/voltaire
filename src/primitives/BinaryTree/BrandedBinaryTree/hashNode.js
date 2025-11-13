import { HashInternal } from "./hashInternal.js";
import { HashLeaf } from "./hashLeaf.js";
import { HashStem } from "./hashStem.js";

/**
 * Factory: Hash any node type
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.blake3 - BLAKE3 hash function
 * @returns {(node: import('./BrandedBinaryTree.js').Node) => Uint8Array} Function that hashes any node type
 * @throws {Error} If node type is unknown
 *
 * @example
 * ```typescript
 * import { HashNode } from '@tevm/voltaire/BinaryTree'
 * import { blake3 } from '@noble/hashes/blake3'
 *
 * const hashNode = HashNode({ blake3 })
 * const emptyNode = { type: 'empty' };
 * const hash = hashNode(emptyNode);
 * console.log(hash.every(b => b === 0)); // true
 * ```
 */
export function HashNode({ blake3 }) {
	const hashInternal = HashInternal({ blake3 });
	const hashStem = HashStem({ blake3 });
	const hashLeaf = HashLeaf({ blake3 });

	return function hashNode(node) {
		switch (node.type) {
			case "empty":
				return new Uint8Array(32);
			case "internal":
				return hashInternal(node.left, node.right);
			case "stem":
				return hashStem(node);
			case "leaf":
				return hashLeaf(node);
			default: {
				const _exhaustive = node;
				throw new Error(`Unknown node type: ${_exhaustive}`);
			}
		}
	};
}
