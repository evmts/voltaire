/**
 * @fileoverview Checks if transaction is a contract creation.
 *
 * @module Transaction/isContractCreation
 * @since 0.0.1
 */
import * as Effect from 'effect/Effect'
import * as VoltaireTransaction from '@tevm/voltaire/Transaction'
import type { Any } from './index.js'

/**
 * Checks if the transaction is a contract creation (to address is null).
 *
 * @param tx - Transaction object
 * @returns Effect containing true if contract creation, false otherwise
 *
 * @example
 * ```typescript
 * import * as Transaction from 'voltaire-effect/primitives/Transaction'
 * import * as Effect from 'effect/Effect'
 *
 * const isCreation = Effect.runSync(Transaction.isContractCreation(tx))
 * if (isCreation) {
 *   console.log('Deploying a new contract')
 * }
 * ```
 *
 * @since 0.0.1
 */
export const isContractCreation = (tx: Any): Effect.Effect<boolean> =>
  Effect.sync(() => VoltaireTransaction.isContractCreation(tx))
