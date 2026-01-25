/**
 * @fileoverview Effect-based constructor and utility functions for MaxFeePerGas primitive.
 * @module MaxFeePerGas/from
 * @since 0.0.1
 */

import { Uint } from '@tevm/voltaire'
import type { MaxFeePerGasType } from './MaxFeePerGasSchema.js'
import type { UintError } from '../Uint/from.js'
import * as Effect from 'effect/Effect'

/**
 * Creates a MaxFeePerGas from a wei value.
 *
 * @description
 * Constructs a branded MaxFeePerGas from wei within an Effect context.
 *
 * @param value - Max fee in wei as bigint, number, or string
 * @returns Effect yielding MaxFeePerGasType on success, or UintError on failure
 *
 * @throws {UintError} When value cannot be converted
 * @throws {UintError} When value is negative
 *
 * @example
 * ```typescript
 * import * as MaxFeePerGas from 'voltaire-effect/primitives/MaxFeePerGas'
 * import { Effect } from 'effect'
 *
 * // 50 gwei in wei
 * const maxFee = MaxFeePerGas.from(50_000_000_000n)
 * const value = Effect.runSync(maxFee)
 * ```
 *
 * @see {@link fromGwei} for gwei input
 * @since 0.0.1
 */
export const from = (value: bigint | number | string): Effect.Effect<MaxFeePerGasType, UintError> =>
  Effect.try({
    try: () => Uint.from(value) as unknown as MaxFeePerGasType,
    catch: (e) => e as UintError
  })

const GWEI = 1_000_000_000n

/**
 * Creates a MaxFeePerGas from a gwei value.
 *
 * @description
 * Constructs a branded MaxFeePerGas from gwei. Preferred for user-facing code.
 *
 * @param value - Max fee in gwei as bigint or number
 * @returns Effect yielding MaxFeePerGasType (in wei) on success
 *
 * @throws {Error} When value cannot be converted
 * @throws {Error} When value is negative
 *
 * @example
 * ```typescript
 * import * as MaxFeePerGas from 'voltaire-effect/primitives/MaxFeePerGas'
 * import { Effect } from 'effect'
 *
 * // Calculate max fee from current conditions
 * const currentBaseFee = 20n  // gwei
 * const priorityFee = 2n      // gwei
 * const buffer = 2n           // 2x base fee buffer
 *
 * const maxFee = MaxFeePerGas.fromGwei(currentBaseFee * buffer + priorityFee)
 * const value = Effect.runSync(maxFee) // 42 gwei in wei
 * ```
 *
 * @see {@link from} for wei input
 * @see {@link toGwei} to convert back
 * @since 0.0.1
 */
export const fromGwei = (value: bigint | number): Effect.Effect<MaxFeePerGasType, Error> =>
  Effect.try({
    try: () => {
      const gwei = typeof value === 'number' ? BigInt(value) : value
      if (gwei < 0n) throw new Error('MaxFeePerGas cannot be negative')
      return (gwei * GWEI) as unknown as MaxFeePerGasType
    },
    catch: (e) => e as Error
  })

/**
 * Converts a max fee from wei to gwei.
 *
 * @description
 * Pure function for display conversion.
 *
 * @param value - Max fee in wei
 * @returns Max fee in gwei
 *
 * @example
 * ```typescript
 * import * as MaxFeePerGas from 'voltaire-effect/primitives/MaxFeePerGas'
 * import { Effect } from 'effect'
 *
 * const maxFeeWei = Effect.runSync(MaxFeePerGas.fromGwei(50))
 * const maxFeeGwei = MaxFeePerGas.toGwei(maxFeeWei) // 50n
 * ```
 *
 * @since 0.0.1
 */
export const toGwei = (value: MaxFeePerGasType): bigint => value / GWEI
