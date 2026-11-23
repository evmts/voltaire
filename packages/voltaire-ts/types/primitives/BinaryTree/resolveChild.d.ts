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
export function resolveChild(node: import("./BinaryTreeType.js").InternalNode, bit: 0 | 1): import("./BinaryTreeType.js").Node;
//# sourceMappingURL=resolveChild.d.ts.map