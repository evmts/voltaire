/**
 * @fileoverview Gets data from transaction.
 *
 * @module Transaction/getData
 * @since 0.0.1
 */
import * as Effect from 'effect/Effect'
import type { Any } from './index.js'

/**
 * Gets the input data from the transaction.
 *
 * @param tx - Transaction object
 * @returns Effect containing the transaction data bytes
 *
 * @example
 * ```typescript
 * import * as Transaction from 'voltaire-effect/primitives/Transaction'
 * import * as Effect from 'effect/Effect'
 *
 * const data = Effect.runSync(Transaction.getData(tx))
 * ```
 *
 * @since 0.0.1
 */
export const getData = (tx: Any): Effect.Effect<Uint8Array> =>
  Effect.sync(() => tx.data)
