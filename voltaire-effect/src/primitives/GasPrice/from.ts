import { Gas } from '@tevm/voltaire'
import type { GasPriceType } from './GasPriceSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error type for gas price operations.
 * @since 0.0.1
 */
export type GasPriceError = Error

/**
 * Creates a GasPrice from a wei value.
 * @param value - Gas price in wei as bigint, number, or string
 * @returns Effect containing GasPriceType or error
 * @example
 * ```ts
 * import * as GasPrice from 'voltaire-effect/primitives/GasPrice'
 *
 * const price = GasPrice.from(1000000000n) // 1 gwei in wei
 * ```
 * @since 0.0.1
 */
export const from = (value: bigint | number | string): Effect.Effect<GasPriceType, GasPriceError> =>
  Effect.try({
    try: () => Gas.GasPrice.from(value),
    catch: (e) => e as GasPriceError
  })

/**
 * Creates a GasPrice from a gwei value.
 * @param value - Gas price in gwei
 * @returns Effect containing GasPriceType in wei
 * @example
 * ```ts
 * import * as GasPrice from 'voltaire-effect/primitives/GasPrice'
 *
 * const price = GasPrice.fromGwei(20) // 20 gwei -> 20000000000 wei
 * ```
 * @since 0.0.1
 */
export const fromGwei = (value: number | bigint): Effect.Effect<GasPriceType, GasPriceError> =>
  Effect.try({
    try: () => Gas.GasPrice.fromGwei(value),
    catch: (e) => e as GasPriceError
  })
