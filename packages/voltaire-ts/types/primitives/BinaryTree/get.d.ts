/**
 * Get value at key
 *
 * @param {import('./BinaryTreeType.js').BinaryTree} tree - Binary tree
 * @param {Uint8Array} k - 32-byte key
 * @returns {Uint8Array | null} Value or null if not found
 *
 * @example
 * ```typescript
 * const tree = BinaryTree.init();
 * const key = new Uint8Array(32);
 * const value = BinaryTree.get(tree, key);
 * console.log(value); // null
 * ```
 */
export function get(tree: import("./BinaryTreeType.js").BinaryTree, k: Uint8Array): Uint8Array | null;
//# sourceMappingURL=get.d.ts.map