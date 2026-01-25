/**
 * @fileoverview Gets recipient address from transaction.
 *
 * @module Transaction/getRecipient
 * @since 0.0.1
 */
import * as Effect from 'effect/Effect'
import * as VoltaireTransaction from '@tevm/voltaire/Transaction'
import type { AddressType } from '@tevm/voltaire/Address'
import type { Any } from './index.js'

/**
 * Gets the recipient address from the transaction.
 *
 * @param tx - Transaction object
 * @returns Effect containing the recipient address, or null for contract creation
 *
 * @example
 * ```typescript
 * import * as Transaction from 'voltaire-effect/primitives/Transaction'
 * import * as Effect from 'effect/Effect'
 *
 * const recipient = Effect.runSync(Transaction.getRecipient(tx))
 * if (recipient === null) {
 *   console.log('Contract creation')
 * }
 * ```
 *
 * @since 0.0.1
 */
export const getRecipient = (tx: Any): Effect.Effect<AddressType | null> =>
  Effect.sync(() => VoltaireTransaction.getRecipient(tx))
