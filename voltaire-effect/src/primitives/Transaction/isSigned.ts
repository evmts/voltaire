/**
 * @fileoverview Checks if transaction is signed.
 *
 * @module Transaction/isSigned
 * @since 0.0.1
 */
import * as Effect from 'effect/Effect'
import * as VoltaireTransaction from '@tevm/voltaire/Transaction'
import type { Any } from './index.js'

/**
 * Checks if the transaction has a valid signature.
 *
 * @param tx - Transaction object
 * @returns Effect containing true if signed, false otherwise
 *
 * @example
 * ```typescript
 * import * as Transaction from 'voltaire-effect/primitives/Transaction'
 * import * as Effect from 'effect/Effect'
 *
 * const signed = Effect.runSync(Transaction.isSigned(tx))
 * if (!signed) {
 *   console.log('Transaction needs to be signed')
 * }
 * ```
 *
 * @since 0.0.1
 */
export const isSigned = (tx: Any): Effect.Effect<boolean> =>
  Effect.sync(() => VoltaireTransaction.isSigned(tx))
