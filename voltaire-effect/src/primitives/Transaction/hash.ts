/**
 * @fileoverview Computes transaction hash with Effect wrapper.
 *
 * @module Transaction/hash
 * @since 0.0.1
 */
import * as Effect from 'effect/Effect'
import * as VoltaireTransaction from '@tevm/voltaire/Transaction'
import type { HashType } from '@tevm/voltaire/Hash'
import type { Any } from './index.js'

/**
 * Computes the Keccak-256 hash of a serialized transaction.
 *
 * @param tx - Transaction object to hash
 * @returns Effect containing the 32-byte transaction hash
 *
 * @example
 * ```typescript
 * import * as Transaction from 'voltaire-effect/primitives/Transaction'
 * import * as Effect from 'effect/Effect'
 *
 * const txHash = Effect.runSync(Transaction.hash(tx))
 * ```
 *
 * @since 0.0.1
 */
export const hash = (tx: Any): Effect.Effect<HashType> =>
  Effect.sync(() => VoltaireTransaction.hash(tx))
