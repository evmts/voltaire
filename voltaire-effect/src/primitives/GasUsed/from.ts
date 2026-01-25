/**
 * @fileoverview Effect-based constructor and utility functions for GasUsed primitive.
 * @module GasUsed/from
 * @since 0.0.1
 */

import { GasUsed } from '@tevm/voltaire'
import type { GasUsedType } from './GasUsedSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when gas used operations fail.
 *
 * @description
 * Tagged error class for GasUsed operations. Includes the `_tag` property
 * for Effect's error handling and pattern matching.
 *
 * @example
 * ```typescript
 * import * as GasUsed from 'voltaire-effect/primitives/GasUsed'
 * import { Effect, pipe } from 'effect'
 *
 * const program = pipe(
 *   GasUsed.from(-1n),
 *   Effect.catchTag('GasUsedError', (e) => {
 *     console.error('Invalid gas:', e.message)
 *     return Effect.succeed(0n as GasUsed.GasUsedType)
 *   })
 * )
 * ```
 *
 * @since 0.0.1
 */
export class GasUsedError {
  readonly _tag = 'GasUsedError'
  constructor(readonly message: string) {}
}

/**
 * Creates a GasUsed value from a numeric input.
 *
 * @description
 * Constructs a branded GasUsed value within an Effect context.
 * Typically used to wrap gas consumption from transaction receipts.
 *
 * @param value - Gas used amount as bigint, number, or string
 * @returns Effect yielding GasUsedType on success, or GasUsedError on failure
 *
 * @throws {GasUsedError} When value cannot be converted
 * @throws {GasUsedError} When value is negative
 *
 * @example
 * ```typescript
 * import * as GasUsed from 'voltaire-effect/primitives/GasUsed'
 * import { Effect } from 'effect'
 *
 * // From transaction receipt
 * const used = GasUsed.from(21000n)
 * const gasValue = Effect.runSync(used)
 *
 * // Parse from hex string
 * const fromHex = GasUsed.from('0x5208')
 * ```
 *
 * @see {@link Schema} for schema-based validation
 * @see {@link calculateCost} to compute transaction fee
 * @since 0.0.1
 */
export const from = (value: bigint | number | string): Effect.Effect<GasUsedType, GasUsedError> =>
  Effect.try({
    try: () => GasUsed.from(value),
    catch: (e) => new GasUsedError((e as Error).message)
  })

/**
 * Calculates the total cost from gas used and gas price.
 *
 * @description
 * Computes the transaction fee as: gasUsed × gasPrice.
 * This is the actual ETH cost of a transaction after execution.
 *
 * @param gasUsed - Amount of gas consumed (from receipt)
 * @param gasPrice - Effective price per gas unit in wei
 * @returns Effect yielding total cost in wei
 *
 * @throws {GasUsedError} When calculation fails
 *
 * @example
 * ```typescript
 * import * as GasUsed from 'voltaire-effect/primitives/GasUsed'
 * import { Effect } from 'effect'
 *
 * // Simple transfer: 21000 gas at 20 gwei
 * const cost = GasUsed.calculateCost(21000n, 20_000_000_000n)
 * const costValue = Effect.runSync(cost) // 420_000_000_000_000n wei = 0.00042 ETH
 *
 * // Contract interaction: 150000 gas at 50 gwei
 * const contractCost = GasUsed.calculateCost(150000n, 50_000_000_000n)
 * // 7_500_000_000_000_000n wei = 0.0075 ETH
 * ```
 *
 * @see {@link from} to create GasUsed from receipt
 * @see {@link EffectiveGasPrice} for calculating effective price
 * @since 0.0.1
 */
export const calculateCost = (gasUsed: bigint | number | string, gasPrice: bigint): Effect.Effect<bigint, GasUsedError> =>
  Effect.try({
    try: () => GasUsed.calculateCost(gasUsed, gasPrice),
    catch: (e) => new GasUsedError((e as Error).message)
  })
