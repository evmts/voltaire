/**
 * @fileoverview Receipt module for Effect-based transaction receipt handling.
 *
 * Provides Effect-wrapped schemas for working with transaction receipts
 * and event logs emitted during transaction execution.
 *
 * Transaction receipts contain:
 * - Transaction identification (hash, block, index)
 * - Execution results (status, gas used)
 * - Contract creation info (if applicable)
 * - Event logs emitted during execution
 * - Bloom filter for efficient log querying
 *
 * This module provides:
 * - Schema validation for receipts and logs
 * - Type-safe branded types
 * - Effect integration for error handling
 *
 * @module Receipt
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import * as Receipt from 'voltaire-effect/primitives/Receipt'
 * import * as S from 'effect/Schema'
 *
 * // Validate a receipt from RPC response
 * const receipt = S.decodeSync(Receipt.ReceiptSchema)(rawReceipt)
 * console.log(receipt.status) // 1 = success, 0 = failed
 * console.log(receipt.gasUsed) // Gas consumed
 * console.log(receipt.logs.length) // Number of events
 * ```
 *
 * @example
 * ```typescript
 * // Check contract creation
 * if (receipt.contractAddress !== null) {
 *   console.log('Contract deployed at:', receipt.contractAddress)
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Process event logs
 * for (const log of receipt.logs) {
 *   console.log('Event from:', log.address)
 *   console.log('Topics:', log.topics)
 * }
 * ```
 *
 * @see {@link ReceiptSchema} for receipt validation
 * @see {@link LogSchema} for log validation
 * @see {@link ReceiptType} for the receipt type definition
 * @see {@link LogType} for the log type definition
 */
export { ReceiptSchema, ReceiptSchema as Schema, LogSchema, ReceiptTypeSchema, type ReceiptType, type LogType } from './ReceiptSchema.js'
