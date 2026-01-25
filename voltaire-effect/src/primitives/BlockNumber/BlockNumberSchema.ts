import { BlockNumber } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

type BlockNumberType = BlockNumber.BlockNumberType

const BlockNumberTypeSchema = Schema.declare<BlockNumberType>(
  (u): u is BlockNumberType => typeof u === 'bigint' && u >= 0n,
  { identifier: 'BlockNumber' }
)

/**
 * Effect Schema for validating and parsing block numbers.
 * Accepts number or bigint, decodes to non-negative BlockNumberType.
 * 
 * @example
 * ```typescript
 * import { BlockNumberSchema } from 'voltaire-effect/primitives/BlockNumber'
 * import * as Schema from 'effect/Schema'
 * 
 * const blockNum = Schema.decodeSync(BlockNumberSchema)(12345)
 * ```
 * 
 * @since 0.0.1
 */
export const BlockNumberSchema: Schema.Schema<BlockNumberType, number | bigint> = Schema.transformOrFail(
  Schema.Union(Schema.Number, Schema.BigIntFromSelf),
  BlockNumberTypeSchema,
  {
    strict: true,
    decode: (n, _options, ast) => {
      try {
        return ParseResult.succeed(BlockNumber.from(n))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, n, (e as Error).message))
      }
    },
    encode: (bn) => ParseResult.succeed(BlockNumber.toBigInt(bn))
  }
).annotations({ identifier: 'BlockNumberSchema' })
