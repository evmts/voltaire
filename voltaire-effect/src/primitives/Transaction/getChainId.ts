/**
 * @fileoverview Gets chain ID from transaction.
 *
 * @module Transaction/getChainId
 * @since 0.0.1
 */
import * as Effect from 'effect/Effect'
import * as VoltaireTransaction from '@tevm/voltaire/Transaction'
import type { Any } from './index.js'

/**
 * Gets the chain ID from the transaction.
 *
 * @param tx - Transaction object
 * @returns Effect containing the chain ID, or null for legacy transactions without EIP-155
 *
 * @example
 * ```typescript
 * import * as Transaction from 'voltaire-effect/primitives/Transaction'
 * import * as Effect from 'effect/Effect'
 *
 * const chainId = Effect.runSync(Transaction.getChainId(tx))
 * ```
 *
 * @since 0.0.1
 */
export const getChainId = (tx: Any): Effect.Effect<bigint | null> =>
  Effect.sync(() => VoltaireTransaction.getChainId(tx))
