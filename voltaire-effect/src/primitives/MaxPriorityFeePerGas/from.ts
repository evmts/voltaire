/**
 * @fileoverview Effect-based constructor and utility functions for MaxPriorityFeePerGas primitive.
 * @module MaxPriorityFeePerGas/from
 * @since 0.0.1
 */

import { Uint } from '@tevm/voltaire'
import type { MaxPriorityFeePerGasType } from './MaxPriorityFeePerGasSchema.js'
import type { UintError } from '../Uint/from.js'
import * as Effect from 'effect/Effect'

/**
 * Creates a MaxPriorityFeePerGas from a wei value.
 *
 * @description
 * Constructs a branded MaxPriorityFeePerGas from wei within an Effect context.
 *
 * @param value - Priority fee in wei as bigint, number, or string
 * @returns Effect yielding MaxPriorityFeePerGasType on success
 *
 * @throws {UintError} When value cannot be converted
 * @throws {UintError} When value is negative
 *
 * @example
 * ```typescript
 * import * as MaxPriorityFeePerGas from 'voltaire-effect/primitives/MaxPriorityFeePerGas'
 * import { Effect } from 'effect'
 *
 * // 2 gwei in wei
 * const tip = MaxPriorityFeePerGas.from(2_000_000_000n)
 * const value = Effect.runSync(tip)
 * ```
 *
 * @see {@link fromGwei} for gwei input
 * @since 0.0.1
 */
export const from = (value: bigint | number | string): Effect.Effect<MaxPriorityFeePerGasType, UintError> =>
  Effect.try({
    try: () => Uint.from(value) as unknown as MaxPriorityFeePerGasType,
    catch: (e) => e as UintError
  })

const GWEI = 1_000_000_000n

/**
 * Creates a MaxPriorityFeePerGas from a gwei value.
 *
 * @description
 * Constructs a branded MaxPriorityFeePerGas from gwei. Preferred for user code.
 *
 * @param value - Priority fee in gwei as bigint or number
 * @returns Effect yielding MaxPriorityFeePerGasType (in wei) on success
 *
 * @throws {Error} When value cannot be converted
 * @throws {Error} When value is negative
 *
 * @example
 * ```typescript
 * import * as MaxPriorityFeePerGas from 'voltaire-effect/primitives/MaxPriorityFeePerGas'
 * import { Effect } from 'effect'
 *
 * // Priority levels
 * const low = MaxPriorityFeePerGas.fromGwei(1)      // 1 gwei
 * const medium = MaxPriorityFeePerGas.fromGwei(2)   // 2 gwei
 * const high = MaxPriorityFeePerGas.fromGwei(5)     // 5 gwei
 * const urgent = MaxPriorityFeePerGas.fromGwei(10)  // 10 gwei
 * ```
 *
 * @see {@link from} for wei input
 * @see {@link toGwei} to convert back
 * @since 0.0.1
 */
export const fromGwei = (value: bigint | number): Effect.Effect<MaxPriorityFeePerGasType, Error> =>
  Effect.try({
    try: () => {
      const gwei = typeof value === 'number' ? BigInt(value) : value
      if (gwei < 0n) throw new Error('MaxPriorityFeePerGas cannot be negative')
      return (gwei * GWEI) as unknown as MaxPriorityFeePerGasType
    },
    catch: (e) => e as Error
  })

/**
 * Converts a priority fee from wei to gwei.
 *
 * @description
 * Pure function for display conversion.
 *
 * @param value - Priority fee in wei
 * @returns Priority fee in gwei
 *
 * @example
 * ```typescript
 * import * as MaxPriorityFeePerGas from 'voltaire-effect/primitives/MaxPriorityFeePerGas'
 * import { Effect } from 'effect'
 *
 * const tipWei = Effect.runSync(MaxPriorityFeePerGas.fromGwei(2))
 * const tipGwei = MaxPriorityFeePerGas.toGwei(tipWei) // 2n
 * ```
 *
 * @since 0.0.1
 */
export const toGwei = (value: MaxPriorityFeePerGasType): bigint => value / GWEI
