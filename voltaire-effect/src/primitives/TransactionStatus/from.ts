import { TransactionStatus } from '@tevm/voltaire'
import type { TransactionStatusType } from './TransactionStatusSchema.js'

/**
 * Creates a pending transaction status.
 * 
 * @returns TransactionStatus with type 'pending'
 * 
 * @example
 * ```typescript
 * import { pending } from './from.js'
 * 
 * const status = pending()
 * ```
 * 
 * @since 0.0.1
 */
export const pending = (): TransactionStatusType => TransactionStatus.pending()

/**
 * Creates a successful transaction status.
 * 
 * @param gasUsed - Amount of gas consumed by the transaction
 * @returns TransactionStatus with type 'success'
 * 
 * @example
 * ```typescript
 * import { success } from './from.js'
 * 
 * const status = success(21000n)
 * ```
 * 
 * @since 0.0.1
 */
export const success = (gasUsed: bigint): TransactionStatusType => TransactionStatus.success(gasUsed as Parameters<typeof TransactionStatus.success>[0])

/**
 * Creates a failed transaction status.
 * 
 * @param revertReason - Optional revert reason string
 * @returns TransactionStatus with type 'failed'
 * 
 * @example
 * ```typescript
 * import { failed } from './from.js'
 * 
 * const status = failed('Insufficient balance')
 * ```
 * 
 * @since 0.0.1
 */
export const failed = (revertReason?: string): TransactionStatusType => TransactionStatus.failed(revertReason)

/**
 * Checks if a transaction status is pending.
 * 
 * @param status - TransactionStatus to check
 * @returns True if status is 'pending'
 * 
 * @example
 * ```typescript
 * import { isPending } from './from.js'
 * 
 * if (isPending(status)) { ... }
 * ```
 * 
 * @since 0.0.1
 */
export const isPending = (status: TransactionStatusType): boolean => TransactionStatus.isPending(status)

/**
 * Checks if a transaction status is success.
 * 
 * @param status - TransactionStatus to check
 * @returns True if status is 'success'
 * 
 * @example
 * ```typescript
 * import { isSuccess } from './from.js'
 * 
 * if (isSuccess(status)) { ... }
 * ```
 * 
 * @since 0.0.1
 */
export const isSuccess = (status: TransactionStatusType): boolean => TransactionStatus.isSuccess(status)

/**
 * Checks if a transaction status is failed.
 * 
 * @param status - TransactionStatus to check
 * @returns True if status is 'failed'
 * 
 * @example
 * ```typescript
 * import { isFailed } from './from.js'
 * 
 * if (isFailed(status)) { ... }
 * ```
 * 
 * @since 0.0.1
 */
export const isFailed = (status: TransactionStatusType): boolean => TransactionStatus.isFailed(status)
