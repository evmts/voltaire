/**
 * @fileoverview FilterId module for Ethereum JSON-RPC filter identifiers.
 * @module FilterId
 * @since 0.0.1
 *
 * @description
 * Filter IDs are unique identifiers returned by Ethereum JSON-RPC filter methods:
 * - eth_newFilter: Creates a filter for event logs
 * - eth_newBlockFilter: Creates a filter for new blocks
 * - eth_newPendingTransactionFilter: Creates a filter for pending transactions
 *
 * These IDs are used with:
 * - eth_getFilterChanges: Poll for new results
 * - eth_getFilterLogs: Get all logs matching the filter
 * - eth_uninstallFilter: Remove the filter
 *
 * This module provides:
 * - Type-safe branded FilterIdType
 * - Effect Schema for validation
 * - Effect-based creation with error handling
 *
 * @example
 * ```typescript
 * import * as FilterId from 'voltaire-effect/primitives/FilterId'
 * import * as Effect from 'effect/Effect'
 * import * as S from 'effect/Schema'
 *
 * // Create from JSON-RPC response
 * const filterId = Effect.runSync(FilterId.from('0x1'))
 *
 * // Using the Schema for validation
 * const parsed = S.decodeSync(FilterId.Schema)('0xabc')
 *
 * // In Effect.gen
 * const program = Effect.gen(function* () {
 *   const id = yield* FilterId.from('0x1')
 *   // Use id with eth_getFilterChanges
 * })
 * ```
 *
 * @see {@link Schema} for Effect Schema integration
 * @see {@link from} for Effect-based creation
 * @see {@link FilterIdError} for error handling
 */
export { Schema, type FilterIdType } from './FilterIdSchema.js'
export { from, FilterIdError } from './from.js'
