import { getStemBit } from "./getStemBit.js";
import { resolveChild } from "./resolveChild.js";
import { splitKey } from "./splitKey.js";

/**
 * Get value at key
 *
 * @param {import('./BinaryTreeType.js').BinaryTree} tree - Binary tree
 * @param {Uint8Array} k - 32-byte key
 * @returns {Uint8Array | null} Value or null if not found
 * @throws {import('./errors.js').InvalidTreeStateError} If the lookup path crosses a pruned (hash-only) internal node
 *
 * @example
 * ```typescript
 * const tree = BinaryTree.init();
 * const key = new Uint8Array(32);
 * const value = BinaryTree.get(tree, key);
 * console.log(value); // null
 * ```
 */
export function get(tree, k) {
	const { stem, idx } = splitKey(k);
	return getNode(tree.root, stem, idx, 0);
}

/**
 * @param {import('./BinaryTreeType.js').Node} node
 * @param {Uint8Array} stem
 * @param {number} idx
 * @param {number} depth
 * @returns {Uint8Array | null}
 */
function getNode(node, stem, idx, depth) {
	switch (node.type) {
		case "empty":
			return null;
		case "stem":
			if (arraysEqual(node.stem, stem)) {
				return node.values[idx] || null;
			}
			return null;
		case "internal":
			return getNode(
				resolveChild(node, getStemBit(stem, depth)),
				stem,
				idx,
				depth + 1,
			);
		case "leaf":
			return null;
	}
}

/**
 * @param {Uint8Array} a
 * @param {Uint8Array} b
 * @returns {boolean}
 */
function arraysEqual(a, b) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}
