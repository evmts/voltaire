/**
 * @fileoverview LogFilter module for working with Ethereum log filter parameters.
 * @module LogFilter
 * @since 0.0.1
 *
 * @description
 * Log filters are used with eth_getLogs and eth_newFilter to query event logs.
 * They specify criteria for matching logs including:
 * - Block range: fromBlock and toBlock
 * - Contract addresses: Single address or array
 * - Topic filters: For filtering by indexed event parameters
 * - Block hash: For querying logs from a specific block
 *
 * This module provides:
 * - Effect Schema for validation and parsing
 * - Type definitions for filter parameters
 *
 * @example
 * ```typescript
 * import * as LogFilter from 'voltaire-effect/primitives/LogFilter'
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
 *
 * // Filter for Transfer events
 * const transferFilter = S.decodeSync(LogFilter.Schema)({
 *   fromBlock: 'earliest',
 *   topics: ['0xddf252ad...']  // Transfer event signature
 * })
 *
 * // Filter multiple addresses
 * const multiFilter = S.decodeSync(LogFilter.Schema)({
 *   address: [addr1, addr2, addr3]
 * })
 * ```
 *
 * @see {@link LogFilterSchema} for Effect Schema integration
 * @see {@link Schema} for the default export alias
 * @see {@link LogFilterType} for the validated type
 * @see {@link BlockTag} for block tag literals
 */
export { LogFilterSchema, Schema, LogFilterTypeSchema, type LogFilterType, type BlockTag } from './LogFilterSchema.js'
