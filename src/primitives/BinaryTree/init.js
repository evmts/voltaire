/**
 * Create empty binary tree
 *
 * @returns {import('./BrandedBinaryTree.js').BinaryTree} Empty tree
 *
 * @example
 * ```typescript
 * const tree = BinaryTree.init();
 * console.log(tree.root.type); // 'empty'
 * ```
 */
export function init() {
	return { root: { type: "empty" } };
}
