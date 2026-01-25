/**
 * LogIndex module for working with event log indices in Effect.
 * A log index represents the position of an event log within a transaction's logs array.
 *
 * @example
 * ```typescript
 * import * as LogIndex from 'voltaire-effect/LogIndex'
 * import * as Effect from 'effect/Effect'
 *
 * // Create a log index
 * const logIndex = Effect.runSync(LogIndex.from(0))
 *
 * // Using the Schema for validation
 * import * as S from 'effect/Schema'
 * const parsed = S.decodeSync(LogIndex.LogIndexSchema)(5)
 * ```
 *
 * @since 0.0.1
 * @module
 */
export { LogIndexSchema } from './LogIndexSchema.js'
export { from, LogIndexError } from './from.js'
