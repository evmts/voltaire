/**
 * @module Receipt
 * @description Effect Schemas for Ethereum transaction receipts and event logs.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Receipt from 'voltaire-effect/primitives/Receipt'
 *
 * function checkSuccess(receipt: Receipt.ReceiptType) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Receipt.Schema` | struct fields | ReceiptType |
 * | `Receipt.LogSchema` | struct fields | LogType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Receipt from 'voltaire-effect/primitives/Receipt'
 * import * as S from 'effect/Schema'
 *
 * // Validate a receipt from RPC response
 * const receipt = S.decodeSync(Receipt.Schema)(rawReceipt)
 * console.log(receipt.status) // 1 = success, 0 = failed (post-Byzantium)
 * console.log(receipt.root)   // pre-Byzantium receipts only
 * console.log(receipt.gasUsed)
 * console.log(receipt.logs.length)
 * ```
 *
 * ## Checking Results
 *
 * ```typescript
 * // Check contract creation
 * if (receipt.contractAddress !== null) {
 *   console.log('Contract deployed at:', receipt.contractAddress)
 * }
 *
 * // Process event logs
 * for (const log of receipt.logs) {
 *   console.log('Event from:', log.address)
 *   console.log('Topics:', log.topics)
 * }
 * ```
 *
 * @since 0.1.0
 *
 * @see {@link ReceiptSchema} for receipt validation
 * @see {@link LogSchema} for log validation
 * @see {@link ReceiptType} for the receipt type definition
 * @see {@link LogType} for the log type definition
 */
export {
	LogSchema,
	type LogType,
	ReceiptSchema,
	ReceiptSchema as Schema,
	type ReceiptType,
	ReceiptTypeSchema,
} from "./ReceiptSchema.js";
