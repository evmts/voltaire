import { hashInternal } from "./hashInternal.js";
import { hashLeaf } from "./hashLeaf.js";
import { hashStem } from "./hashStem.js";

/**
 * Hash any node type
 *
 * @param {import('./BrandedBinaryTree.js').Node} node - Any node type
 * @returns {Uint8Array} Hash (32 bytes)
 * @throws {Error} If node type is unknown
 *
 * @example
 * ```typescript
 * const emptyNode = { type: 'empty' };
 * const hash = BinaryTree.hashNode(emptyNode);
 * console.log(hash.every(b => b === 0)); // true
 * ```
 */
export function hashNode(node) {
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
}
