/**
 * @fileoverview Effect-based functions for creating and validating log indices.
 * @module LogIndex/from
 * @since 0.0.1
 *
 * @description
 * Provides Effect-wrapped operations for creating validated log indices.
 * Log indices represent the position of event logs within a transaction.
 */

import { LogIndex } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * The LogIndex type representing a validated log index within a transaction.
 *
 * @see {@link from} for creating instances
 * @since 0.0.1
 */
type LogIndexType = ReturnType<typeof LogIndex.from>

/**
 * Error thrown when LogIndex parsing fails due to invalid input.
 *
 * @description
 * This error occurs when attempting to create a log index from an invalid value,
 * such as a negative number or a non-integer.
 *
 * @example
 * ```typescript
 * import * as LogIndex from 'voltaire-effect/primitives/LogIndex'
 * import * as Effect from 'effect/Effect'
 *
 * const result = LogIndex.from(-1)
 * Effect.runSync(Effect.either(result))
 * // Left(LogIndexError { message: 'Log index must be non-negative' })
 * ```
 *
 * @see {@link from} for the function that throws this error
 * @since 0.0.1
 */
export class LogIndexError extends Error {
  /** Discriminant tag for Effect error handling */
  readonly _tag = 'LogIndexError'

  /**
   * Creates a new LogIndexError.
   * @param message - Description of the validation failure
   * @param cause - Original error that caused this failure
   */
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'LogIndexError'
  }
}

/**
 * Creates a LogIndex from a number or bigint, wrapped in an Effect.
 *
 * @description
 * Log index represents the position of an event log within a transaction's logs array.
 * The index must be a non-negative integer. This function wraps the creation in an
 * Effect for type-safe error handling.
 *
 * @param value - The log index value (must be a non-negative integer)
 * @returns An Effect that resolves to LogIndexType or fails with LogIndexError
 *
 * @example
 * ```typescript
 * import * as LogIndex from 'voltaire-effect/primitives/LogIndex'
 * import * as Effect from 'effect/Effect'
 *
 * // Create from number
 * const logIndex = Effect.runSync(LogIndex.from(0))  // First log
 * const index5 = Effect.runSync(LogIndex.from(5))    // Sixth log
 *
 * // Create from bigint
 * const fromBigInt = Effect.runSync(LogIndex.from(5n))
 *
 * // In Effect.gen
 * const program = Effect.gen(function* () {
 *   const idx = yield* LogIndex.from(3)
 *   return idx
 * })
 *
 * // Handle errors
 * const result = Effect.runSync(
 *   Effect.catchAll(LogIndex.from(-1), (e) =>
 *     Effect.succeed(`Error: ${e.message}`)
 *   )
 * )
 * ```
 *
 * @throws {LogIndexError} When value is negative or not an integer
 * @see {@link LogIndexSchema} for Schema-based validation
 * @since 0.0.1
 */
export function from(value: number | bigint): Effect.Effect<LogIndexType, LogIndexError> {
  return Effect.try({
    try: () => LogIndex.from(value),
    catch: (e) => new LogIndexError((e as Error).message, e)
  })
}
