/**
 * @fileoverview Effect-based constructor and utility functions for EffectiveGasPrice primitive.
 * @module EffectiveGasPrice/from
 * @since 0.0.1
 */

import * as Effect from 'effect/Effect'
import type { EffectiveGasPriceType } from './EffectiveGasPriceSchema.js'

/**
 * Error thrown when effective gas price operations fail.
 *
 * @description
 * Tagged error class for EffectiveGasPrice operations. Includes the `_tag`
 * property for Effect's error handling and pattern matching.
 *
 * @since 0.0.1
 */
export class EffectiveGasPriceError extends Error {
  readonly _tag = 'EffectiveGasPriceError'
  constructor(message: string) {
    super(message)
    this.name = 'EffectiveGasPriceError'
  }
}

/**
 * Creates an EffectiveGasPrice from numeric input.
 *
 * @description
 * Constructs a branded EffectiveGasPrice from a wei value. Use when you
 * have a pre-calculated effective price (e.g., from transaction receipt).
 *
 * @param value - Gas price value in wei
 * @returns Effect yielding EffectiveGasPriceType on success
 *
 * @throws {EffectiveGasPriceError} When value cannot be converted
 *
 * @example
 * ```typescript
 * import * as EffectiveGasPrice from 'voltaire-effect/primitives/EffectiveGasPrice'
 * import { Effect } from 'effect'
 *
 * // From transaction receipt
 * const price = EffectiveGasPrice.from(22000000000n) // 22 gwei
 * const value = Effect.runSync(price)
 * ```
 *
 * @see {@link calculate} to compute from EIP-1559 parameters
 * @since 0.0.1
 */
export const from = (value: bigint | number | string): Effect.Effect<EffectiveGasPriceType, EffectiveGasPriceError> =>
  Effect.try({
    try: () => BigInt(value) as EffectiveGasPriceType,
    catch: (e) => new EffectiveGasPriceError((e as Error).message)
  })

/**
 * Creates an EffectiveGasPrice from gwei value.
 *
 * @param gwei - Gas price in gwei
 * @returns Effect yielding EffectiveGasPriceType (in wei)
 * @since 0.0.1
 */
export const fromGwei = (gwei: bigint | number | string): Effect.Effect<EffectiveGasPriceType, EffectiveGasPriceError> =>
  Effect.try({
    try: () => (BigInt(gwei) * 1000000000n) as EffectiveGasPriceType,
    catch: (e) => new EffectiveGasPriceError((e as Error).message)
  })

/**
 * Creates an EffectiveGasPrice from wei value.
 *
 * @param wei - Gas price in wei
 * @returns Effect yielding EffectiveGasPriceType
 * @since 0.0.1
 */
export const fromWei = (wei: bigint | number | string): Effect.Effect<EffectiveGasPriceType, EffectiveGasPriceError> =>
  Effect.try({
    try: () => BigInt(wei) as EffectiveGasPriceType,
    catch: (e) => new EffectiveGasPriceError((e as Error).message)
  })

/**
 * Calculates effective gas price from EIP-1559 parameters.
 * Returns min(baseFee + priorityFee, maxFeePerGas).
 *
 * @param baseFee - Block base fee
 * @param priorityFee - Max priority fee per gas
 * @param maxFeePerGas - Max fee per gas
 * @returns Effect yielding calculated EffectiveGasPriceType
 * @example
 * ```typescript
 * import * as EffectiveGasPrice from 'voltaire-effect/EffectiveGasPrice'
 * import { Effect } from 'effect'
 *
 * const price = Effect.runSync(
 *   EffectiveGasPrice.calculate(20n * 10n**9n, 2n * 10n**9n, 30n * 10n**9n)
 * )
 * ```
 * @since 0.0.1
 */
export const calculate = (
  baseFee: bigint,
  priorityFee: bigint,
  maxFeePerGas: bigint
): Effect.Effect<EffectiveGasPriceType, EffectiveGasPriceError> =>
  Effect.try({
    try: () => {
      const sum = baseFee + priorityFee
      return (sum > maxFeePerGas ? maxFeePerGas : sum) as EffectiveGasPriceType
    },
    catch: (e) => new EffectiveGasPriceError((e as Error).message)
  })

/**
 * Converts gas price to gwei.
 *
 * @param price - The gas price in wei
 * @returns Effect yielding price in gwei
 * @since 0.0.1
 */
export const toGwei = (price: EffectiveGasPriceType): Effect.Effect<bigint, never> =>
  Effect.succeed(price / 1000000000n)

/**
 * Converts gas price to wei (identity).
 *
 * @param price - The gas price
 * @returns Effect yielding price in wei
 * @since 0.0.1
 */
export const toWei = (price: EffectiveGasPriceType): Effect.Effect<bigint, never> =>
  Effect.succeed(price as bigint)

/**
 * Converts gas price to number.
 *
 * @param price - The gas price
 * @returns Effect yielding price as number
 * @since 0.0.1
 */
export const toNumber = (price: EffectiveGasPriceType): Effect.Effect<number, never> =>
  Effect.succeed(Number(price))

/**
 * Converts gas price to bigint.
 *
 * @param price - The gas price
 * @returns Effect yielding price as bigint
 * @since 0.0.1
 */
export const toBigInt = (price: EffectiveGasPriceType): Effect.Effect<bigint, never> =>
  Effect.succeed(price as bigint)

/**
 * Compares two gas prices for equality.
 *
 * @param a - First gas price
 * @param b - Second gas price
 * @returns Effect yielding true if equal
 * @since 0.0.1
 */
export const equals = (a: EffectiveGasPriceType, b: EffectiveGasPriceType): Effect.Effect<boolean, never> =>
  Effect.succeed(a === b)

/**
 * Compares two gas prices.
 *
 * @param a - First gas price
 * @param b - Second gas price
 * @returns Effect yielding -1 if a < b, 0 if equal, 1 if a > b
 * @since 0.0.1
 */
export const compare = (a: EffectiveGasPriceType, b: EffectiveGasPriceType): Effect.Effect<number, never> =>
  Effect.succeed(a < b ? -1 : a > b ? 1 : 0)
