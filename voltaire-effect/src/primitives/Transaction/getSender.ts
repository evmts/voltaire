/**
 * @fileoverview Recovers sender address from transaction signature.
 *
 * @module Transaction/getSender
 * @since 0.0.1
 */
import * as Effect from 'effect/Effect'
import * as VoltaireTransaction from '@tevm/voltaire/Transaction'
import type { AddressType } from '@tevm/voltaire/Address'
import type { Any } from './index.js'

/**
 * Recovers the sender address from the transaction signature.
 *
 * @param tx - Signed transaction object
 * @returns Effect containing the recovered sender address
 *
 * @example
 * ```typescript
 * import * as Transaction from 'voltaire-effect/primitives/Transaction'
 * import * as Effect from 'effect/Effect'
 *
 * const sender = Effect.runSync(Transaction.getSender(signedTx))
 * ```
 *
 * @since 0.0.1
 */
export const getSender = (tx: Any): Effect.Effect<AddressType> =>
  Effect.sync(() => VoltaireTransaction.getSender(tx))
