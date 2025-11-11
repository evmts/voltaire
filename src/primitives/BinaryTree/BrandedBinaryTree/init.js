/**
 * Create empty binary tree
 *
 * @see https://voltaire.tevm.sh/primitives/binarytree for BinaryTree documentation
 * @since 0.0.0
 * @returns {import('./BrandedBinaryTree.js').BinaryTree} Empty tree
 * @throws {never}
 * @example
 * ```javascript
 * import * as BinaryTree from './primitives/BinaryTree/index.js';
 * const tree = BinaryTree.init();
 * console.log(tree.root.type); // 'empty'
 * ```
 */
export function init() {
	return { root: { type: "empty" } };
}
