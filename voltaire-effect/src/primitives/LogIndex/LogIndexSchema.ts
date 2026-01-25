/**
 * @fileoverview Effect Schema for validating log indices within transactions.
 * @module LogIndex/LogIndexSchema
 * @since 0.0.1
 *
 * @description
 * A log index represents the position of an event log within a transaction's logs array.
 * Log indices are zero-based non-negative integers used to uniquely identify logs
 * within a single transaction.
 */

import { LogIndex } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * The LogIndex type representing a validated log index within a transaction.
 *
 * @description
 * A log index is a non-negative integer indicating the position of an event log
 * within the array of logs emitted by a transaction. The first log has index 0.
 *
 * @example
 * ```typescript
 * import { LogIndex } from 'voltaire-effect/primitives'
 *
 * // First log in transaction
 * const firstLog: LogIndexType = 0
 *
 * // Tenth log
 * const tenthLog: LogIndexType = 9
 * ```
 *
 * @see {@link LogIndexSchema} for validation
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
 *
 * @description
 * A log index is the position of an event log within a transaction's logs array.
 * This schema validates that the input is a non-negative integer, accepting both
 * number and bigint inputs.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { LogIndexSchema } from 'voltaire-effect/primitives/LogIndex'
 *
 * const parse = S.decodeSync(LogIndexSchema)
 *
 * // Parse from number
 * const logIndex = parse(0)  // First log in transaction
 * const index5 = parse(5)    // Sixth log
 *
 * // Parse from bigint
 * const fromBigInt = parse(5n)
 *
 * // Invalid inputs throw ParseError
 * // parse(-1)    // Error: negative not allowed
 * // parse(1.5)   // Error: must be integer
 * ```
 *
 * @throws {ParseError} When input is negative or not an integer
 * @see {@link from} for Effect-based creation
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
