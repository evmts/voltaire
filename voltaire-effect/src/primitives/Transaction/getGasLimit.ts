/**
 * @fileoverview Gets gas limit from transaction.
 *
 * @module Transaction/getGasLimit
 * @since 0.0.1
 */
import * as Effect from 'effect/Effect'
import type { Any } from './index.js'

/**
 * Gets the gas limit from the transaction.
 *
 * @param tx - Transaction object
 * @returns Effect containing the gas limit
 *
 * @example
 * ```typescript
 * import * as Transaction from 'voltaire-effect/primitives/Transaction'
 * import * as Effect from 'effect/Effect'
 *
 * const gasLimit = Effect.runSync(Transaction.getGasLimit(tx))
 * ```
 *
 * @since 0.0.1
 */
export const getGasLimit = (tx: Any): Effect.Effect<bigint> =>
  Effect.sync(() => tx.gasLimit)
