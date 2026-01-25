import { BinaryTree } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

type BinaryTreeType = BinaryTree.BinaryTreeType

const BinaryTreeTypeSchema = Schema.declare<BinaryTreeType>(
  (u): u is BinaryTreeType => {
    if (typeof u !== 'object' || u === null) return false
    return 'root' in u && typeof (u as BinaryTreeType).root !== 'undefined'
  },
  { identifier: 'BinaryTree' }
)

/**
 * Effect Schema for validating BinaryTree structures.
 * Identity transform - validates the tree structure.
 * 
 * @example
 * ```typescript
 * import { BinaryTreeSchema } from 'voltaire-effect/primitives/BinaryTree'
 * import * as Schema from 'effect/Schema'
 * 
 * const validated = Schema.decodeSync(BinaryTreeSchema)(tree)
 * ```
 * 
 * @since 0.0.1
 */
export const BinaryTreeSchema: Schema.Schema<BinaryTreeType, BinaryTreeType> = Schema.transformOrFail(
  BinaryTreeTypeSchema,
  BinaryTreeTypeSchema,
  {
    strict: true,
    decode: (t, _options, _ast) => ParseResult.succeed(t),
    encode: (t) => ParseResult.succeed(t)
  }
).annotations({ identifier: 'BinaryTreeSchema' })
