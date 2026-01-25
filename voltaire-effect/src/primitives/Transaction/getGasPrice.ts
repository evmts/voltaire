/**
 * @fileoverview Gets effective gas price from transaction.
 *
 * @module Transaction/getGasPrice
 * @since 0.0.1
 */
import * as Effect from 'effect/Effect'
import * as VoltaireTransaction from '@tevm/voltaire/Transaction'
import type { Any } from './index.js'

/**
 * Gets the effective gas price for the transaction.
 *
 * For legacy/EIP-2930: returns gasPrice
 * For EIP-1559+: returns min(maxFeePerGas, baseFee + maxPriorityFeePerGas)
 *
 * @param tx - Transaction object
 * @param baseFee - Optional base fee for EIP-1559 calculations
 * @returns Effect containing the effective gas price in wei
 *
 * @example
 * ```typescript
 * import * as Transaction from 'voltaire-effect/primitives/Transaction'
 * import * as Effect from 'effect/Effect'
 *
 * const gasPrice = Effect.runSync(Transaction.getGasPrice(tx, 30000000000n))
 * ```
 *
 * @since 0.0.1
 */
export const getGasPrice = (tx: Any, baseFee?: bigint): Effect.Effect<bigint> =>
  Effect.sync(() => VoltaireTransaction.getGasPrice(tx, baseFee))
