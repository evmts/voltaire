import { BinaryTree } from "@tevm/voltaire";
import * as Effect from "effect/Effect";

type BinaryTreeType = BinaryTree.BinaryTreeType;

/**
 * Initializes a new empty binary tree.
 * Always succeeds synchronously.
 *
 * @returns Effect yielding an empty BinaryTreeType
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as BinaryTree from 'voltaire-effect/primitives/BinaryTree'
 *
 * const tree = await Effect.runPromise(BinaryTree.init())
 * ```
 *
 * @since 0.0.1
 */
export const init = (): Effect.Effect<BinaryTreeType, never> =>
	Effect.succeed(BinaryTree.init());
