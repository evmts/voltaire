/**
 * @fileoverview Effect-based functions for creating topic filters.
 * @module TopicFilter/from
 * @since 0.0.1
 *
 * @description
 * Provides Effect-wrapped operations for creating validated topic filters
 * used with eth_getLogs for event filtering.
 */

import { TopicFilter } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * A single topic entry that can be a 32-byte topic hash, an array of topic hashes (OR condition), or null (wildcard).
 *
 * @see {@link TopicFilterType} for usage in filter arrays
 * @since 0.0.1
 */
type TopicEntry = Uint8Array | readonly Uint8Array[] | null

/**
 * Topic filter type representing up to 4 indexed event parameters.
 *
 * @see {@link from} for creating instances
 * @since 0.0.1
 */
type TopicFilterType = readonly [TopicEntry?, TopicEntry?, TopicEntry?, TopicEntry?]

/**
 * Error thrown when topic filter creation fails.
 *
 * @description
 * This error occurs when attempting to create a topic filter with invalid input,
 * such as malformed topic hashes or too many topics.
 *
 * @example
 * ```typescript
 * import * as TopicFilter from 'voltaire-effect/primitives/TopicFilter'
 * import * as Effect from 'effect/Effect'
 *
 * const result = TopicFilter.from([invalidTopic])
 * Effect.runSync(Effect.either(result))
 * // Left(TopicFilterError { message: 'Invalid topic format' })
 * ```
 *
 * @see {@link from} for the function that throws this error
 * @since 0.0.1
 */
export class TopicFilterError extends Error {
  /** Discriminant tag for Effect error handling */
  readonly _tag = 'TopicFilterError'

  /**
   * Creates a new TopicFilterError.
   * @param message - Error description
   * @param cause - Original error that caused this failure
   */
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'TopicFilterError'
  }
}

/**
 * Creates a validated TopicFilter from an array of topic entries.
 *
 * @description
 * Topic filters are used to filter event logs by their indexed parameters.
 * Each position can be:
 * - A specific 32-byte topic (exact match)
 * - An array of topics (match ANY - OR condition)
 * - null (match any value - wildcard)
 *
 * @param topics - Tuple of up to 4 topic entries
 * @returns Effect containing the validated TopicFilter or TopicFilterError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as TopicFilter from 'voltaire-effect/primitives/TopicFilter'
 *
 * // Filter for any Transfer event
 * const filter = await Effect.runPromise(TopicFilter.from([
 *   transferEventSignature,
 *   null,  // any sender
 *   null   // any recipient
 * ]))
 *
 * // Filter for transfers from specific address
 * const fromAddress = await Effect.runPromise(TopicFilter.from([
 *   transferEventSignature,
 *   senderAddressTopic,  // Specific sender (padded to 32 bytes)
 *   null                 // Any recipient
 * ]))
 *
 * // Filter for transfers to any of multiple recipients
 * const toMultiple = await Effect.runPromise(TopicFilter.from([
 *   transferEventSignature,
 *   null,                           // Any sender
 *   [recipient1Topic, recipient2Topic]  // Either recipient
 * ]))
 *
 * // In Effect.gen
 * const program = Effect.gen(function* () {
 *   const filter = yield* TopicFilter.from([eventSig, null, null])
 *   // Use filter with eth_getLogs
 * })
 * ```
 *
 * @throws {TopicFilterError} When topics are invalid or malformed
 * @see {@link TopicFilterSchema} for Schema-based validation
 * @since 0.0.1
 */
export const from = (
  topics: readonly [TopicEntry?, TopicEntry?, TopicEntry?, TopicEntry?]
): Effect.Effect<TopicFilterType, TopicFilterError> =>
  Effect.try({
    try: () => TopicFilter.from(topics as any) as TopicFilterType,
    catch: (e) => new TopicFilterError(
      e instanceof Error ? e.message : String(e),
      e
    )
  })
