/**
 * @fileoverview LogIndex module for working with event log indices in Effect.
 * @module LogIndex
 * @since 0.0.1
 *
 * @description
 * A log index represents the position of an event log within a transaction's logs array.
 * Log indices are zero-based, so the first event emitted by a transaction has index 0.
 *
 * This module provides:
 * - Effect Schema for validation
 * - Effect-based creation with proper error handling
 *
 * @example
 * ```typescript
 * import * as LogIndex from 'voltaire-effect/primitives/LogIndex'
 * import * as Effect from 'effect/Effect'
 * import * as S from 'effect/Schema'
 *
 * // Create a log index with Effect
 * const logIndex = Effect.runSync(LogIndex.from(0))
 *
 * // Using the Schema for validation
 * const parsed = S.decodeSync(LogIndex.LogIndexSchema)(5)
 *
 * // In Effect.gen
 * const program = Effect.gen(function* () {
 *   const idx = yield* LogIndex.from(3)
 *   console.log(`Log at position ${idx}`)
 * })
 * ```
 *
 * @see {@link LogIndexSchema} for Effect Schema integration
 * @see {@link from} for Effect-based creation
 * @see {@link LogIndexError} for error handling
 */

export { LogIndexSchema } from "./Number.js";
