import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded type representing an Ethereum chain ID.
 * Chain IDs are positive integers that uniquely identify a network.
 * @since 0.0.1
 */
export type ChainIdType = number & { readonly __tag: 'ChainId' }

const ChainIdTypeSchema = S.declare<ChainIdType>(
  (u): u is ChainIdType => typeof u === 'number' && Number.isInteger(u) && u > 0,
  { identifier: 'ChainId' }
)

/**
 * Effect Schema for validating Ethereum chain IDs.
 * Ensures the value is a positive integer.
 *
 * @example
 * ```typescript
 * import * as ChainId from 'voltaire-effect/ChainId'
 * import * as Schema from 'effect/Schema'
 *
 * const id = Schema.decodeSync(ChainId.Schema)(1) // Ethereum mainnet
 * ```
 * @since 0.0.1
 */
export const ChainIdSchema: S.Schema<ChainIdType, number> = S.transformOrFail(
  S.Number,
  ChainIdTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      if (!Number.isInteger(value) || value <= 0) {
        return ParseResult.fail(new ParseResult.Type(ast, value, 'Chain ID must be a positive integer'))
      }
      return ParseResult.succeed(value as ChainIdType)
    },
    encode: (chainId) => ParseResult.succeed(chainId)
  }
).annotations({ identifier: 'ChainIdSchema' })
