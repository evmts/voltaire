import { LogIndex } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * The LogIndex type representing a validated log index within a transaction.
 * @since 0.0.1
 */
type LogIndexType = ReturnType<typeof LogIndex.from>

/**
 * Error thrown when LogIndex parsing fails due to invalid input.
 *
 * @example
 * ```typescript
 * import * as LogIndex from 'voltaire-effect/LogIndex'
 * import * as Effect from 'effect/Effect'
 *
 * const result = LogIndex.from(-1)
 * Effect.runSync(Effect.either(result))
 * // Left(LogIndexError { message: '...' })
 * ```
 *
 * @since 0.0.1
 */
export class LogIndexError extends Error {
  readonly _tag = 'LogIndexError'
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'LogIndexError'
  }
}

/**
 * Creates a LogIndex from a number or bigint, wrapped in an Effect.
 * Log index represents the position of an event log within a transaction.
 *
 * @param value - The log index value (must be a non-negative integer)
 * @returns An Effect that resolves to LogIndexType or fails with LogIndexError
 *
 * @example
 * ```typescript
 * import * as LogIndex from 'voltaire-effect/LogIndex'
 * import * as Effect from 'effect/Effect'
 *
 * const logIndex = Effect.runSync(LogIndex.from(0))
 * const fromBigInt = Effect.runSync(LogIndex.from(5n))
 * ```
 *
 * @since 0.0.1
 */
export function from(value: number | bigint): Effect.Effect<LogIndexType, LogIndexError> {
  return Effect.try({
    try: () => LogIndex.from(value),
    catch: (e) => new LogIndexError((e as Error).message, e)
  })
}
