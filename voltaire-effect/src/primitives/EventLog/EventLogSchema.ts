import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'
import * as EventLog from '@tevm/voltaire/EventLog'
import type { EventLogType } from '@tevm/voltaire/EventLog'
import { AddressSchema } from '../Address/AddressSchema.js'
import { HashSchema } from '../Hash/HashSchema.js'

/**
 * Internal schema for validating EventLog structure.
 */
const EventLogTypeSchema = S.declare<EventLogType>(
  (u): u is EventLogType => {
    if (typeof u !== 'object' || u === null) return false
    const log = u as Record<string, unknown>
    return (
      'address' in log &&
      log.address instanceof Uint8Array &&
      (log.address as Uint8Array).length === 20 &&
      'topics' in log &&
      Array.isArray(log.topics) &&
      'data' in log &&
      log.data instanceof Uint8Array
    )
  },
  { identifier: 'EventLog' }
)

const EventLogSchemaInternal = S.Struct({
  address: AddressSchema,
  topics: S.Array(HashSchema),
  data: S.Uint8ArrayFromSelf,
  blockNumber: S.optional(S.BigIntFromSelf),
  transactionHash: S.optional(HashSchema),
  transactionIndex: S.optional(S.Number),
  blockHash: S.optional(HashSchema),
  logIndex: S.optional(S.Number),
  removed: S.optional(S.Boolean),
})

/**
 * Effect Schema for validating EVM event logs.
 * Validates log structure including address, topics, and data.
 *
 * @example
 * ```typescript
 * import * as EventLog from 'voltaire-effect/EventLog'
 * import * as Schema from 'effect/Schema'
 *
 * const log = Schema.decodeSync(EventLog.Schema)({
 *   address: contractAddress,
 *   topics: [eventTopic],
 *   data: eventData
 * })
 * ```
 * @since 0.0.1
 */
export const EventLogSchema: S.Schema<EventLogType, S.Schema.Encoded<typeof EventLogSchemaInternal>> = S.transformOrFail(
  EventLogSchemaInternal,
  EventLogTypeSchema,
  {
    strict: true,
    decode: (d, _options, ast) => {
      try {
        return ParseResult.succeed(EventLog.from({
          address: d.address,
          topics: d.topics,
          data: d.data,
          blockNumber: d.blockNumber,
          transactionHash: d.transactionHash,
          transactionIndex: d.transactionIndex,
          blockHash: d.blockHash,
          logIndex: d.logIndex,
          removed: d.removed,
        }))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, d, (e as Error).message))
      }
    },
    encode: (e) => ParseResult.succeed({
      address: e.address,
      topics: [...e.topics],
      data: e.data,
      blockNumber: e.blockNumber,
      transactionHash: e.transactionHash,
      transactionIndex: e.transactionIndex,
      blockHash: e.blockHash,
      logIndex: e.logIndex,
      removed: e.removed,
    })
  }
).annotations({ identifier: 'EventLogSchema' })

/**
 * Alias for EventLogSchema.
 * @since 0.0.1
 */
export { EventLogSchema as Schema, EventLogTypeSchema }

/**
 * Type representing an EVM event log entry.
 * @since 0.0.1
 */
export type { EventLogType }
