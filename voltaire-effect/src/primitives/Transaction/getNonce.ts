/**
 * @fileoverview Gets nonce from transaction.
 *
 * @module Transaction/getNonce
 * @since 0.0.1
 */
import * as Effect from 'effect/Effect'
import type { Any } from './index.js'

/**
 * Gets the nonce from the transaction.
 *
 * @param tx - Transaction object
 * @returns Effect containing the nonce
 *
 * @example
 * ```typescript
 * import * as Transaction from 'voltaire-effect/primitives/Transaction'
 * import * as Effect from 'effect/Effect'
 *
 * const nonce = Effect.runSync(Transaction.getNonce(tx))
 * ```
 *
 * @since 0.0.1
 */
export const getNonce = (tx: Any): Effect.Effect<bigint> =>
  Effect.sync(() => tx.nonce)
