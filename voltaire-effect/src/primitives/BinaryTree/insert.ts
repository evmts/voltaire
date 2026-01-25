import { BinaryTree } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

type BinaryTreeType = BinaryTree.BinaryTreeType

/**
 * Inserts a key-value pair into the binary tree.
 * Returns a new tree with the inserted value (immutable).
 * Never throws - returns Effect with error in channel.
 * 
 * @param tree - The binary tree to insert into
 * @param key - The key for the new entry
 * @param value - The value to store
 * @returns Effect yielding updated BinaryTreeType or failing with Error
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as BinaryTree from 'voltaire-effect/primitives/BinaryTree'
 * 
 * const updated = await Effect.runPromise(BinaryTree.insert(tree, key, value))
 * ```
 * 
 * @since 0.0.1
 */
export const insert = (
  tree: BinaryTreeType,
  key: Uint8Array,
  value: Uint8Array
): Effect.Effect<BinaryTreeType, Error> =>
  Effect.try({
    try: () => BinaryTree.insert(tree, key, value),
    catch: (e) => e as Error
  })
