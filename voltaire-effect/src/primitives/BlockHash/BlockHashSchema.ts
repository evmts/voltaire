import { BlockHash } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

type BlockHashType = BlockHash.BlockHashType

const BlockHashTypeSchema = Schema.declare<BlockHashType>(
  (u): u is BlockHashType => {
    if (!(u instanceof Uint8Array)) return false
    try {
      BlockHash.toHex(u as BlockHashType)
      return true
    } catch {
      return false
    }
  },
  { identifier: 'BlockHash' }
)

/**
 * Effect Schema for validating and parsing block hashes.
 * Decodes hex strings to 32-byte BlockHashType.
 * 
 * @example
 * ```typescript
 * import { BlockHashSchema } from 'voltaire-effect/primitives/BlockHash'
 * import * as Schema from 'effect/Schema'
 * 
 * const hash = Schema.decodeSync(BlockHashSchema)('0x...')
 * ```
 * 
 * @since 0.0.1
 */
export const BlockHashSchema: Schema.Schema<BlockHashType, string> = Schema.transformOrFail(
  Schema.String,
  BlockHashTypeSchema,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(BlockHash.from(s))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (h) => ParseResult.succeed(BlockHash.toHex(h))
  }
).annotations({ identifier: 'BlockHashSchema' })
