/**
 * TransactionIndex module for representing a transaction's position within a block.
 * 
 * Transaction indices are zero-based positions of transactions in block order.
 * 
 * @example
 * ```typescript
 * import * as TransactionIndex from './index.js'
 * import * as Effect from 'effect/Effect'
 * 
 * const index = await Effect.runPromise(TransactionIndex.from(5))
 * const num = TransactionIndex.toNumber(index)
 * ```
 * 
 * @module TransactionIndex
 * @since 0.0.1
 */
export { Schema, type TransactionIndexType } from './TransactionIndexSchema.js'
export { from, toNumber, equals, TransactionIndexError } from './from.js'
