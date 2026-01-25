/**
 * @fileoverview Detects transaction type from serialized data.
 *
 * @module Transaction/detectType
 * @since 0.0.1
 */
import * as Effect from 'effect/Effect'
import * as VoltaireTransaction from '@tevm/voltaire/Transaction'
import { InvalidFormatError, InvalidTransactionTypeError } from '@tevm/voltaire/errors'

/**
 * Detects the transaction type from serialized data.
 *
 * @param data - RLP-encoded transaction bytes
 * @returns Effect containing the transaction type enum value
 *
 * @example
 * ```typescript
 * import * as Transaction from 'voltaire-effect/primitives/Transaction'
 * import * as Effect from 'effect/Effect'
 *
 * const type = await Effect.runPromise(Transaction.detectType(rawBytes))
 * if (type === Transaction.Type.EIP1559) {
 *   console.log('EIP-1559 transaction')
 * }
 * ```
 *
 * @since 0.0.1
 */
export const detectType = (data: Uint8Array): Effect.Effect<VoltaireTransaction.Type, InvalidFormatError | InvalidTransactionTypeError> =>
  Effect.try({
    try: () => VoltaireTransaction.detectType(data),
    catch: (e) => e as InvalidFormatError | InvalidTransactionTypeError,
  })
