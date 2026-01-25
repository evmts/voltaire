/**
 * @fileoverview Effect-based receipt creation.
 * @module from
 * @since 0.0.1
 */

import { Receipt, type ReceiptType, InvalidReceiptError, InvalidReceiptLengthError } from '@tevm/voltaire/Receipt'
import * as Effect from 'effect/Effect'

/**
 * Creates a Receipt from partial data.
 * 
 * @param data - Receipt data with required fields
 * @returns Effect that yields ReceiptType on success, or fails with InvalidReceiptError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Receipt from 'voltaire-effect/primitives/Receipt'
 * 
 * const receipt = await Effect.runPromise(
 *   Receipt.from({
 *     transactionHash: txHash,
 *     transactionIndex: 0,
 *     blockHash: blockHash,
 *     blockNumber: 12345n,
 *     from: senderAddress,
 *     to: recipientAddress,
 *     cumulativeGasUsed: 21000n,
 *     gasUsed: 21000n,
 *     contractAddress: null,
 *     logs: [],
 *     logsBloom: new Uint8Array(256),
 *     status: 1,
 *     effectiveGasPrice: 1000000000n,
 *     type: 'eip1559'
 *   })
 * )
 * ```
 * 
 * @since 0.0.1
 */
export const from = (
  data: Omit<ReceiptType, typeof import('@tevm/voltaire/brand').brand>
): Effect.Effect<ReceiptType, InvalidReceiptError | InvalidReceiptLengthError> =>
  Effect.try({
    try: () => Receipt.from(data),
    catch: (e) => {
      if (e instanceof InvalidReceiptError) return e
      if (e instanceof InvalidReceiptLengthError) return e
      return new InvalidReceiptError(
        e instanceof Error ? e.message : String(e),
        { value: data, expected: 'valid receipt' }
      )
    }
  })
