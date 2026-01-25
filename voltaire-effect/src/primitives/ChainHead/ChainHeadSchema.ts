import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'
import { ChainHead } from '@tevm/voltaire'

/**
 * Type representing the head of a blockchain.
 * Contains block number, hash, timestamp and difficulty information.
 * @since 0.0.1
 */
export type ChainHeadType = ChainHead.ChainHeadType

const ChainHeadTypeSchema = S.declare<ChainHeadType>(
  (u): u is ChainHeadType =>
    u !== null &&
    typeof u === 'object' &&
    'number' in u &&
    'hash' in u &&
    'timestamp' in u,
  { identifier: 'ChainHead' }
)

/**
 * Input type for creating a ChainHead.
 * @since 0.0.1
 */
export type ChainHeadInput = {
  readonly number: bigint | number | string
  readonly hash: Uint8Array | string
  readonly timestamp: bigint | number | string
  readonly difficulty?: bigint | number | string
  readonly totalDifficulty?: bigint | number | string
}

/**
 * Effect Schema for validating blockchain head data.
 * Transforms input into branded ChainHeadType values.
 *
 * @example
 * ```typescript
 * import * as ChainHead from 'voltaire-effect/ChainHead'
 * import * as Schema from 'effect/Schema'
 *
 * const head = Schema.decodeSync(ChainHead.ChainHeadSchema)({
 *   number: 19000000n,
 *   hash: '0x...',
 *   timestamp: 1700000000n
 * })
 * ```
 * @since 0.0.1
 */
export const ChainHeadSchema: S.Schema<ChainHeadType, ChainHeadInput> = S.transformOrFail(
  S.Struct({
    number: S.Union(S.BigIntFromSelf, S.Number, S.String),
    hash: S.Union(S.Uint8ArrayFromSelf, S.String),
    timestamp: S.Union(S.BigIntFromSelf, S.Number, S.String),
    difficulty: S.optional(S.Union(S.BigIntFromSelf, S.Number, S.String)),
    totalDifficulty: S.optional(S.Union(S.BigIntFromSelf, S.Number, S.String)),
  }),
  ChainHeadTypeSchema,
  {
    strict: true,
    decode: (input, _options, ast) => {
      try {
        return ParseResult.succeed(ChainHead.from(input as any))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, input, (e as Error).message))
      }
    },
    encode: (chainHead) => ParseResult.succeed({
      number: chainHead.number,
      hash: chainHead.hash as any,
      timestamp: chainHead.timestamp,
      difficulty: chainHead.difficulty,
      totalDifficulty: chainHead.totalDifficulty,
    })
  }
).annotations({ identifier: 'ChainHeadSchema' })
