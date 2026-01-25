/**
 * TransactionStatus module for representing transaction execution states.
 * 
 * Transactions can be pending, successful, or failed.
 * 
 * @example
 * ```typescript
 * import * as TransactionStatus from './index.js'
 * 
 * const pending = TransactionStatus.pending()
 * const success = TransactionStatus.success(21000n)
 * const failed = TransactionStatus.failed('Out of gas')
 * 
 * if (TransactionStatus.isSuccess(status)) { ... }
 * ```
 * 
 * @module TransactionStatus
 * @since 0.0.1
 */
export { Schema, type TransactionStatusType } from './TransactionStatusSchema.js'
export { pending, success, failed, isPending, isSuccess, isFailed } from './from.js'
