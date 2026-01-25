/**
 * LogFilter module for working with Ethereum log filter parameters in Effect.
 * Used for querying event logs with eth_getLogs and eth_newFilter.
 *
 * @example
 * ```typescript
 * import * as LogFilter from 'voltaire-effect/LogFilter'
 * import * as S from 'effect/Schema'
 *
 * // Create a filter for events from a specific address
 * const filter = S.decodeSync(LogFilter.Schema)({
 *   fromBlock: 'latest',
 *   address: '0x1234567890123456789012345678901234567890'
 * })
 *
 * // Filter by block range
 * const rangeFilter = S.decodeSync(LogFilter.Schema)({
 *   fromBlock: 1000000n,
 *   toBlock: 1000100n
 * })
 * ```
 *
 * @since 0.0.1
 * @module
 */
export { LogFilterSchema, Schema, LogFilterTypeSchema, type LogFilterType, type BlockTag } from './LogFilterSchema.js'
