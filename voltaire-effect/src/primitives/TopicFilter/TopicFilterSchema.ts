import { TopicFilter } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * A single topic entry that can be a 32-byte topic hash, an array of topic hashes (OR condition), or null (wildcard).
 * @since 0.0.1
 */
type TopicEntry = Uint8Array | readonly Uint8Array[] | null

/**
 * Topic filter type representing up to 4 indexed event parameters.
 * Each position corresponds to an indexed parameter in the event signature.
 * @since 0.0.1
 */
type TopicFilterType = readonly [TopicEntry?, TopicEntry?, TopicEntry?, TopicEntry?]

/**
 * Internal schema declaration for TopicFilter type validation.
 * @since 0.0.1
 */
const TopicFilterTypeSchema = S.declare<TopicFilterType>(
  (u): u is TopicFilterType => Array.isArray(u) && u.length <= 4,
  { identifier: 'TopicFilter' }
)

/**
 * Effect Schema for validating and transforming topic filters for event log filtering.
 * 
 * Topic filters are used with eth_getLogs to filter events by their indexed parameters.
 * Each position in the array corresponds to an indexed parameter, with null acting as a wildcard.
 * 
 * @param value - Array of topic entries to validate
 * @returns Schema that transforms to TopicFilterType
 * 
 * @example
 * ```typescript
 * import * as Schema from 'effect/Schema'
 * import { TopicFilterSchema } from './TopicFilterSchema.js'
 * 
 * // Filter for Transfer events with specific sender
 * const filter = Schema.decodeSync(TopicFilterSchema)([
 *   transferEventSignature,  // Topic 0: event signature
 *   senderAddress,           // Topic 1: from address
 *   null                     // Topic 2: any to address
 * ])
 * ```
 * 
 * @since 0.0.1
 */
export const TopicFilterSchema: S.Schema<TopicFilterType, readonly any[]> = S.transformOrFail(
  S.Array(S.Any),
  TopicFilterTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(TopicFilter.from(value as any) as TopicFilterType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (filter) => ParseResult.succeed([...filter])
  }
).annotations({ identifier: 'TopicFilterSchema' })
