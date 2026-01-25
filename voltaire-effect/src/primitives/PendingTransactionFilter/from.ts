import { PendingTransactionFilter, FilterId } from '@tevm/voltaire'
import type { PendingTransactionFilterType } from './PendingTransactionFilterSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when PendingTransactionFilter creation fails.
 *
 * @example
 * ```typescript
 * import { PendingTransactionFilterError } from 'voltaire-effect/primitives/PendingTransactionFilter'
 *
 * const error = new PendingTransactionFilterError('Invalid filter ID')
 * console.log(error._tag) // 'PendingTransactionFilterError'
 * ```
 *
 * @since 0.0.1
 */
export class PendingTransactionFilterError {
  /** Discriminant tag for error identification */
  readonly _tag = 'PendingTransactionFilterError'
  /**
   * Creates a new PendingTransactionFilterError.
   * @param message - Error description
   */
  constructor(readonly message: string) {}
}

/**
 * Creates a PendingTransactionFilter from a filter ID using Effect for error handling.
 *
 * @param filterIdValue - Filter ID string from eth_newPendingTransactionFilter
 * @returns Effect that succeeds with PendingTransactionFilterType or fails with PendingTransactionFilterError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { from } from 'voltaire-effect/primitives/PendingTransactionFilter'
 *
 * const filter = from('0x1')
 * const result = Effect.runSync(filter)
 * console.log(result.type) // 'pendingTransaction'
 * ```
 *
 * @since 0.0.1
 */
export const from = (filterIdValue: string): Effect.Effect<PendingTransactionFilterType, PendingTransactionFilterError> =>
  Effect.try({
    try: () => {
      const filterId = FilterId.from(filterIdValue)
      return PendingTransactionFilter.from(filterId)
    },
    catch: (e) => new PendingTransactionFilterError((e as Error).message)
  })
