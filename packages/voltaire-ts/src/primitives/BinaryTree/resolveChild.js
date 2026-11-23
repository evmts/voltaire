import { InvalidTreeStateError } from "./errors.js";

/** @type {import('./BinaryTreeType.js').EmptyNode} */
const EMPTY = { type: "empty" };

/**
 * Resolve the child subtree of an internal node on the given side.
 *
 * An absent child whose hash is zero is an empty subtree. An absent child
 * with a non-zero hash is a pruned (hash-only) subtree that cannot be read.
 *
 * @param {import('./BinaryTreeType.js').InternalNode} node - Internal node
 * @param {0 | 1} bit - 0 for left, 1 for right
 * @returns {import('./BinaryTreeType.js').Node} Child node
 * @throws {InvalidTreeStateError} If the child is pruned
 */
export function resolveChild(node, bit) {
	const child = bit === 0 ? node.leftChild : node.rightChild;
	if (child) return child;
	const hash = bit === 0 ? node.left : node.right;
	if (hash.every((b) => b === 0)) return EMPTY;
	throw new InvalidTreeStateError(
		"Internal node child is pruned (hash only) and cannot be traversed",
		{
			value: bit === 0 ? "left" : "right",
			expected: "child node or zero hash",
			docsPath: "/primitives/binary-tree/operations#error-handling",
		},
	);
}
