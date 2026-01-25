import { BlockBody } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

type BlockBodyType = BlockBody.BlockBodyType

const BlockBodyTypeSchema = Schema.declare<BlockBodyType>(
  (u): u is BlockBodyType => {
    if (typeof u !== 'object' || u === null) return false
    return 'transactions' in u && 'ommers' in u
  },
  { identifier: 'BlockBody' }
)

/**
 * Effect Schema for validating block body structures.
 * Validates transactions and ommers fields.
 * 
 * @example
 * ```typescript
 * import { BlockBodySchema } from 'voltaire-effect/primitives/BlockBody'
 * import * as Schema from 'effect/Schema'
 * 
 * const body = Schema.decodeSync(BlockBodySchema)(bodyData)
 * ```
 * 
 * @since 0.0.1
 */
export const BlockBodySchema: Schema.Schema<BlockBodyType, BlockBodyType> = Schema.transformOrFail(
  BlockBodyTypeSchema,
  BlockBodyTypeSchema,
  {
    strict: true,
    decode: (t, _options, _ast) => ParseResult.succeed(t),
    encode: (t) => ParseResult.succeed(t)
  }
).annotations({ identifier: 'BlockBodySchema' })
