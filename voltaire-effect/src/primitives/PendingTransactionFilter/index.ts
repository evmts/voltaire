/**
 * PendingTransactionFilter module for Effect-based pending transaction subscriptions.
 *
 * Provides Effect-wrapped operations for creating and managing filters that
 * receive notifications when new pending transactions are added to the mempool.
 *
 * @example
 * ```typescript
 * import * as PendingTransactionFilter from 'voltaire-effect/primitives/PendingTransactionFilter'
 * import * as Effect from 'effect/Effect'
 *
 * // Create filter from filter ID
 * const filter = PendingTransactionFilter.from('0x1')
 * const result = Effect.runSync(filter)
 * console.log(result.type) // 'pendingTransaction'
 * ```
 *
 * @module
 * @since 0.0.1
 */
export { Schema, type PendingTransactionFilterType } from './PendingTransactionFilterSchema.js'
export { from, PendingTransactionFilterError } from './from.js'
