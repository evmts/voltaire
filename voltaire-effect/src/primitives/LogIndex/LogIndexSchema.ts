import { LogIndex } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * The LogIndex type representing a validated log index within a transaction.
 * @since 0.0.1
 */
type LogIndexType = ReturnType<typeof LogIndex.from>

/**
 * Internal schema declaration for LogIndex type validation.
 * @internal
 */
const LogIndexTypeSchema = S.declare<LogIndexType>(
  (u): u is LogIndexType => typeof u === 'number' && Number.isInteger(u) && u >= 0,
  { identifier: 'LogIndex' }
)

/**
 * Effect Schema for validating and parsing log indices.
 * A log index is the position of an event log within a transaction's logs array.
 *
 * @param input - A number or bigint representing the log index (must be non-negative)
 * @returns The validated LogIndexType
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { LogIndexSchema } from 'voltaire-effect/LogIndex'
 *
 * // Parse from number
 * const logIndex = S.decodeSync(LogIndexSchema)(0)
 *
 * // Parse from bigint
 * const fromBigInt = S.decodeSync(LogIndexSchema)(5n)
 * ```
 *
 * @since 0.0.1
 */
export const LogIndexSchema: S.Schema<LogIndexType, number | bigint> = S.transformOrFail(
  S.Union(S.Number, S.BigIntFromSelf),
  LogIndexTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(LogIndex.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (logIndex) => ParseResult.succeed(logIndex)
  }
).annotations({ identifier: 'LogIndexSchema' })
