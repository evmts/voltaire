import { TopicFilter } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * A single topic entry that can be a 32-byte topic hash, an array of topic hashes (OR condition), or null (wildcard).
 * @since 0.0.1
 */
type TopicEntry = Uint8Array | readonly Uint8Array[] | null

/**
 * Topic filter type representing up to 4 indexed event parameters.
 * @since 0.0.1
 */
type TopicFilterType = readonly [TopicEntry?, TopicEntry?, TopicEntry?, TopicEntry?]

/**
 * Error thrown when topic filter creation fails.
 * 
 * @example
 * ```typescript
 * import { TopicFilterError } from './from.js'
 * 
 * const error = new TopicFilterError('Invalid topic format', originalError)
 * console.log(error._tag) // 'TopicFilterError'
 * ```
 * 
 * @since 0.0.1
 */
export class TopicFilterError extends Error {
  /** Discriminant tag for error identification */
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
 * Topic filters are used to filter event logs by their indexed parameters.
 * Each position can be a specific topic, an array of topics (OR), or null (any).
 * 
 * @param topics - Tuple of up to 4 topic entries
 * @returns Effect containing the validated TopicFilter or TopicFilterError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { from } from './from.js'
 * 
 * // Filter for any Transfer event
 * const filter = await Effect.runPromise(from([
 *   transferEventSignature,
 *   null,  // any sender
 *   null   // any recipient
 * ]))
 * ```
 * 
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
