/**
 * @fileoverview Effect-based constructor functions for GasPrice primitive.
 * @module GasPrice/from
 * @since 0.0.1
 */

import { Gas } from '@tevm/voltaire'
import type { GasPriceType } from './GasPriceSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error type for gas price operations.
 *
 * @description
 * Thrown when gas price construction fails, typically due to invalid input
 * such as negative values or non-numeric strings.
 *
 * @since 0.0.1
 */
export type GasPriceError = Error

/**
 * Creates a GasPrice from a wei value.
 *
 * @description
 * Constructs a branded GasPrice value from wei within an Effect context.
 * Wei is the smallest unit of ETH (1 ETH = 10^18 wei).
 *
 * @param value - Gas price in wei as bigint, number, or string
 * @returns Effect yielding GasPriceType on success, or GasPriceError on failure
 *
 * @throws {GasPriceError} When value cannot be converted to a valid gas price
 * @throws {GasPriceError} When value is negative
 *
 * @example
 * ```typescript
 * import * as GasPrice from 'voltaire-effect/primitives/GasPrice'
 * import { Effect } from 'effect'
 *
 * // 1 gwei in wei
 * const price = GasPrice.from(1000000000n)
 *
 * // Run and get the value
 * const priceValue = Effect.runSync(price)
 *
 * // From hex string (e.g., RPC response)
 * const priceFromHex = GasPrice.from('0x3b9aca00')
 * ```
 *
 * @see {@link fromGwei} for gwei input
 * @see {@link GasPriceSchema} for schema-based validation
 * @since 0.0.1
 */
export const from = (value: bigint | number | string): Effect.Effect<GasPriceType, GasPriceError> =>
  Effect.try({
    try: () => Gas.GasPrice.from(value),
    catch: (e) => e as GasPriceError
  })

/**
 * Creates a GasPrice from a gwei value.
 *
 * @description
 * Constructs a branded GasPrice value from gwei. This is the preferred
 * constructor for user-facing code since gas prices are typically
 * expressed in gwei. The value is stored internally as wei.
 *
 * Conversion: 1 gwei = 1,000,000,000 wei (10^9)
 *
 * @param value - Gas price in gwei as number or bigint
 * @returns Effect yielding GasPriceType (in wei) on success
 *
 * @throws {GasPriceError} When value cannot be converted
 * @throws {GasPriceError} When value is negative
 *
 * @example
 * ```typescript
 * import * as GasPrice from 'voltaire-effect/primitives/GasPrice'
 * import { Effect } from 'effect'
 *
 * // Common gas prices
 * const lowPriority = GasPrice.fromGwei(10)    // 10 gwei
 * const standard = GasPrice.fromGwei(20)       // 20 gwei
 * const fast = GasPrice.fromGwei(50)           // 50 gwei
 *
 * // Calculate transaction fee
 * const gasUsed = 21000n
 * const price = Effect.runSync(GasPrice.fromGwei(20))
 * const fee = gasUsed * price // 420,000 gwei = 0.00042 ETH
 * ```
 *
 * @see {@link from} for wei input
 * @see {@link GasPriceFromGweiSchema} for schema-based validation
 * @since 0.0.1
 */
export const fromGwei = (value: number | bigint): Effect.Effect<GasPriceType, GasPriceError> =>
  Effect.try({
    try: () => Gas.GasPrice.fromGwei(value),
    catch: (e) => e as GasPriceError
  })
