/**
 * @fileoverview Effect-based constructor and utility functions for BaseFeePerGas primitive.
 * @module BaseFeePerGas/from
 * @since 0.0.1
 */

import { Uint } from '@tevm/voltaire'
import type { BaseFeePerGasType } from './BaseFeePerGasSchema.js'
import type { UintError } from '../Uint/from.js'
import * as Effect from 'effect/Effect'

/**
 * Creates a BaseFeePerGas from a wei value.
 *
 * @description
 * Constructs a branded BaseFeePerGas from wei within an Effect context.
 * Use when parsing base fees from block headers or RPC responses.
 *
 * @param value - Base fee in wei as bigint, number, or string
 * @returns Effect yielding BaseFeePerGasType on success, or UintError on failure
 *
 * @throws {UintError} When value cannot be converted
 * @throws {UintError} When value is negative
 *
 * @example
 * ```typescript
 * import * as BaseFeePerGas from 'voltaire-effect/primitives/BaseFeePerGas'
 * import { Effect } from 'effect'
 *
 * // From block header
 * const baseFee = BaseFeePerGas.from(20_000_000_000n) // 20 gwei in wei
 * const value = Effect.runSync(baseFee)
 *
 * // From hex string
 * const fromHex = BaseFeePerGas.from('0x4a817c800')
 * ```
 *
 * @see {@link fromGwei} for gwei input
 * @see {@link BaseFeePerGasSchema} for schema validation
 * @since 0.0.1
 */
export const from = (value: bigint | number | string): Effect.Effect<BaseFeePerGasType, UintError> =>
  Effect.try({
    try: () => Uint.from(value) as unknown as BaseFeePerGasType,
    catch: (e) => e as UintError
  })

const GWEI = 1_000_000_000n

/**
 * Creates a BaseFeePerGas from a gwei value.
 *
 * @description
 * Constructs a branded BaseFeePerGas from gwei. More ergonomic for
 * user-facing code since base fees are typically expressed in gwei.
 *
 * @param value - Base fee in gwei as bigint or number
 * @returns Effect yielding BaseFeePerGasType (in wei) on success
 *
 * @throws {Error} When value cannot be converted
 * @throws {Error} When value is negative
 *
 * @example
 * ```typescript
 * import * as BaseFeePerGas from 'voltaire-effect/primitives/BaseFeePerGas'
 * import { Effect } from 'effect'
 *
 * // Typical base fees
 * const lowCongestion = BaseFeePerGas.fromGwei(10)   // 10 gwei
 * const normalCongestion = BaseFeePerGas.fromGwei(25)  // 25 gwei
 * const highCongestion = BaseFeePerGas.fromGwei(100)   // 100 gwei
 *
 * const value = Effect.runSync(lowCongestion)
 * ```
 *
 * @see {@link from} for wei input
 * @see {@link toGwei} to convert back to gwei
 * @since 0.0.1
 */
export const fromGwei = (value: bigint | number): Effect.Effect<BaseFeePerGasType, Error> =>
  Effect.try({
    try: () => {
      const gwei = typeof value === 'number' ? BigInt(value) : value
      if (gwei < 0n) throw new Error('BaseFeePerGas cannot be negative')
      return (gwei * GWEI) as unknown as BaseFeePerGasType
    },
    catch: (e) => e as Error
  })

/**
 * Converts a base fee from wei to gwei.
 *
 * @description
 * Pure function that converts the internal wei representation to gwei
 * for display purposes. Does not return an Effect since this cannot fail.
 *
 * @param value - Base fee in wei
 * @returns Base fee in gwei
 *
 * @example
 * ```typescript
 * import * as BaseFeePerGas from 'voltaire-effect/primitives/BaseFeePerGas'
 * import { Effect } from 'effect'
 *
 * const baseFeeWei = Effect.runSync(BaseFeePerGas.fromGwei(25))
 * const baseFeeGwei = BaseFeePerGas.toGwei(baseFeeWei) // 25n
 *
 * console.log(`Current base fee: ${baseFeeGwei} gwei`)
 * ```
 *
 * @see {@link fromGwei} to create from gwei
 * @since 0.0.1
 */
export const toGwei = (value: BaseFeePerGasType): bigint => value / GWEI
