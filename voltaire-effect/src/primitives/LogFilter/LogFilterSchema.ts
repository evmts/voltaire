import * as S from 'effect/Schema'
import * as LogFilter from '@tevm/voltaire/LogFilter'
import type { LogFilterType, BlockTag } from '@tevm/voltaire/LogFilter'
import { AddressSchema } from '../Address/AddressSchema.js'
import { HashSchema } from '../Hash/HashSchema.js'

/**
 * Internal schema declaration for LogFilter type validation.
 * @internal
 */
const LogFilterTypeSchema = S.declare<LogFilterType>(
  (u): u is LogFilterType => {
    if (typeof u !== 'object' || u === null) return false
    const filter = u as Record<string, unknown>
    if ('address' in filter && filter.address !== undefined) {
      if (Array.isArray(filter.address)) {
        if (!filter.address.every(a => a instanceof Uint8Array && a.length === 20)) {
          return false
        }
      } else if (!(filter.address instanceof Uint8Array && (filter.address as Uint8Array).length === 20)) {
        return false
      }
    }
    return true
  },
  { identifier: 'LogFilter' }
)

/**
 * Schema for block tags used in log filter queries.
 * @since 0.0.1
 */
const BlockTagSchema = S.Union(
  S.Literal('earliest'),
  S.Literal('latest'),
  S.Literal('pending')
)

/**
 * Schema for block identifiers (block number or tag).
 * @since 0.0.1
 */
const BlockIdentifierSchema = S.Union(S.BigIntFromSelf, BlockTagSchema)

/**
 * Schema for topic filter entries (single topic, array of topics, or null).
 * @since 0.0.1
 */
const TopicEntrySchema = S.Union(
  HashSchema,
  S.Array(HashSchema),
  S.Null
)

/**
 * Schema for the topics array in a log filter.
 * @since 0.0.1
 */
const TopicFilterSchema = S.Array(TopicEntrySchema)

/**
 * Internal schema structure for log filter parameters.
 * @internal
 */
const LogFilterSchemaInternal = S.Struct({
  fromBlock: S.optional(BlockIdentifierSchema),
  toBlock: S.optional(BlockIdentifierSchema),
  address: S.optional(S.Union(AddressSchema, S.Array(AddressSchema))),
  topics: S.optional(TopicFilterSchema),
  blockhash: S.optional(HashSchema),
})

/**
 * Effect Schema for validating and parsing Ethereum log filter parameters.
 * Log filters are used with eth_getLogs and eth_newFilter to query event logs.
 *
 * @param input - An object containing filter parameters (fromBlock, toBlock, address, topics, blockhash)
 * @returns The validated LogFilterType
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { LogFilterSchema } from 'voltaire-effect/LogFilter'
 *
 * // Create a filter for Transfer events from a specific address
 * const filter = S.decodeSync(LogFilterSchema)({
 *   fromBlock: 'latest',
 *   address: '0x1234567890123456789012345678901234567890',
 *   topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef']
 * })
 *
 * // Filter by block range
 * const rangeFilter = S.decodeSync(LogFilterSchema)({
 *   fromBlock: 1000000n,
 *   toBlock: 1000100n
 * })
 * ```
 *
 * @since 0.0.1
 */
export const LogFilterSchema = S.transform(
  LogFilterSchemaInternal,
  LogFilterTypeSchema,
  {
    strict: true,
    decode: (d) => LogFilter.from(d as Parameters<typeof LogFilter.from>[0]),
    encode: (e) => e as unknown as S.Schema.Type<typeof LogFilterSchemaInternal>
  }
).annotations({ identifier: 'LogFilterSchema' })

export { LogFilterSchema as Schema, LogFilterTypeSchema }

/**
 * The LogFilter type representing validated log filter parameters.
 * @since 0.0.1
 */
export type { LogFilterType }

/**
 * Block tag type for log filter queries ('earliest', 'latest', 'pending').
 * @since 0.0.1
 */
export type { BlockTag }
