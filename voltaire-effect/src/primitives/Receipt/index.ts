/**
 * Receipt module for Effect-based transaction receipt handling.
 *
 * Provides Effect-wrapped schemas for working with transaction receipts
 * and event logs emitted during transaction execution.
 *
 * @example
 * ```typescript
 * import * as Receipt from 'voltaire-effect/primitives/Receipt'
 * import * as S from 'effect/Schema'
 *
 * const receipt = S.decodeSync(Receipt.ReceiptSchema)(rawReceipt)
 * console.log(receipt.status) // 1 = success, 0 = failed
 * console.log(receipt.logs.length) // Number of events
 * ```
 *
 * @module
 * @since 0.0.1
 */
export { ReceiptSchema, ReceiptSchema as Schema, LogSchema, ReceiptTypeSchema, type ReceiptType, type LogType } from './ReceiptSchema.js'
