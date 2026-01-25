/**
 * BinaryTree module for Merkle binary tree operations.
 * Provides Effect-based functions for tree initialization, insertion, and lookup.
 * 
 * @example
 * ```typescript
 * import * as BinaryTree from 'voltaire-effect/primitives/BinaryTree'
 * import * as Effect from 'effect/Effect'
 * 
 * const program = Effect.gen(function* () {
 *   const tree = yield* BinaryTree.init()
 *   const updated = yield* BinaryTree.insert(tree, key, value)
 *   return BinaryTree.rootHash(updated)
 * })
 * ```
 * 
 * @since 0.0.1
 * @module
 */

export { BinaryTreeSchema, BinaryTreeSchema as Schema } from './BinaryTreeSchema.js'
export { init } from './init.js'
export { insert } from './insert.js'
export { get } from './get.js'
export { rootHash } from './rootHash.js'
