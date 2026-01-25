/**
 * @fileoverview Gets value from transaction.
 *
 * @module Transaction/getValue
 * @since 0.0.1
 */
import * as Effect from 'effect/Effect'
import type { Any } from './index.js'

/**
 * Gets the value (amount of wei to transfer) from the transaction.
 *
 * @param tx - Transaction object
 * @returns Effect containing the value in wei
 *
 * @example
 * ```typescript
 * import * as Transaction from 'voltaire-effect/primitives/Transaction'
 * import * as Effect from 'effect/Effect'
 *
 * const value = Effect.runSync(Transaction.getValue(tx))
 * ```
 *
 * @since 0.0.1
 */
export const getValue = (tx: Any): Effect.Effect<bigint> =>
  Effect.sync(() => tx.value)
