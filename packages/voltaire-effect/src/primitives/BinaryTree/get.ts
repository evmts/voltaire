import { BinaryTree } from "@tevm/voltaire";
import * as Effect from "effect/Effect";

type BinaryTreeType = BinaryTree.BinaryTreeType;

/**
 * Gets a value from the binary tree by key.
 * Returns null if key is not found.
 *
 * @param tree - The binary tree to search
 * @param key - The key to look up
 * @returns Effect yielding the value or null if not found
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as BinaryTree from 'voltaire-effect/primitives/BinaryTree'
 *
 * const value = await Effect.runPromise(BinaryTree.get(tree, key))
 * ```
 *
 * @since 0.0.1
 */
export const get = (
	tree: BinaryTreeType,
	key: Uint8Array,
): Effect.Effect<Uint8Array | null, never> =>
	Effect.succeed(BinaryTree.get(tree, key));
