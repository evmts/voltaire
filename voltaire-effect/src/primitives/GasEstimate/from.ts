/**
 * @fileoverview Effect-based constructor and utility functions for GasEstimate primitive.
 * @module GasEstimate/from
 * @since 0.0.1
 */

import { GasEstimate as VoltaireGasEstimate, Gas } from '@tevm/voltaire'
import type { GasEstimateType } from './GasEstimateSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Branded type for gas limits used in transaction submission.
 *
 * @description
 * Gas limits define the maximum gas a transaction can consume. Transactions
 * fail if they exceed this limit. Set from gas estimates with a safety buffer.
 *
 * @see {@link GasEstimateType} for pre-execution estimates
 * @since 0.0.1
 */
export type GasLimitType = Gas.GasLimitType

/**
 * Error type for gas estimate operations.
 *
 * @description
 * Thrown when gas estimate operations fail, such as invalid input values,
 * negative estimates, or conversion errors.
 *
 * @since 0.0.1
 */
export type GasEstimateError = Error

/**
 * Creates a GasEstimate from a numeric value.
 *
 * @description
 * Constructs a branded GasEstimate within an Effect context. Typically used
 * to wrap the result of an `eth_estimateGas` RPC call.
 *
 * @param value - Gas estimate as bigint, number, or string
 * @returns Effect yielding GasEstimateType on success, or GasEstimateError on failure
 *
 * @throws {GasEstimateError} When value cannot be converted to a valid estimate
 * @throws {GasEstimateError} When value is negative
 *
 * @example
 * ```typescript
 * import * as GasEstimate from 'voltaire-effect/primitives/GasEstimate'
 * import { Effect } from 'effect'
 *
 * // Create from eth_estimateGas result
 * const estimate = GasEstimate.from(52000n)
 *
 * // Run to get the value
 * const estimateValue = Effect.runSync(estimate)
 *
 * // Parse from hex string
 * const fromHex = GasEstimate.from('0xcb20')
 * ```
 *
 * @see {@link GasEstimateSchema} for schema-based validation
 * @see {@link withBuffer} to add safety margin
 * @since 0.0.1
 */
export const from = (value: bigint | number | string): Effect.Effect<GasEstimateType, GasEstimateError> =>
  Effect.try({
    try: () => VoltaireGasEstimate.GasEstimate.from(value),
    catch: (e) => e as GasEstimateError
  })

/**
 * Adds a percentage buffer to a gas estimate for safety margin.
 *
 * @description
 * Gas estimates can become inaccurate if blockchain state changes between
 * estimation and execution. Adding a buffer (typically 10-20%) helps ensure
 * the transaction has enough gas to complete.
 *
 * Formula: bufferedEstimate = estimate * (1 + percentageBuffer / 100)
 *
 * @param estimate - Base gas estimate to buffer
 * @param percentageBuffer - Buffer percentage (e.g., 20 for 20% increase)
 * @returns Effect yielding buffered GasEstimateType
 *
 * @throws {GasEstimateError} When calculation fails
 *
 * @example
 * ```typescript
 * import * as GasEstimate from 'voltaire-effect/primitives/GasEstimate'
 * import { Effect, pipe } from 'effect'
 *
 * // Add 20% buffer to estimate
 * const program = pipe(
 *   GasEstimate.from(50000n),
 *   Effect.flatMap(est => GasEstimate.withBuffer(est, 20))
 * )
 * const buffered = Effect.runSync(program) // 60000n
 *
 * // Different buffer levels
 * const safe = GasEstimate.withBuffer(estimate, 10)    // +10%
 * const veryLafe = GasEstimate.withBuffer(estimate, 50) // +50%
 * ```
 *
 * @see {@link toGasLimit} to convert for transaction submission
 * @since 0.0.1
 */
export const withBuffer = (estimate: GasEstimateType, percentageBuffer: number): Effect.Effect<GasEstimateType, GasEstimateError> =>
  Effect.try({
    try: () => VoltaireGasEstimate.GasEstimate.withBuffer(estimate, percentageBuffer),
    catch: (e) => e as GasEstimateError
  })

/**
 * Converts a gas estimate to a gas limit for transaction submission.
 *
 * @description
 * Transforms a GasEstimateType to a GasLimitType for use in transaction
 * parameters. The gas limit is the maximum gas the transaction can use.
 * If the transaction uses more, it fails with an out-of-gas error.
 *
 * @param estimate - Gas estimate to convert
 * @returns Effect yielding GasLimitType for transaction submission
 *
 * @throws {GasEstimateError} When conversion fails
 *
 * @example
 * ```typescript
 * import * as GasEstimate from 'voltaire-effect/primitives/GasEstimate'
 * import { Effect, pipe } from 'effect'
 *
 * // Full workflow: estimate -> buffer -> limit
 * const program = pipe(
 *   GasEstimate.from(52000n),
 *   Effect.flatMap(est => GasEstimate.withBuffer(est, 20)),
 *   Effect.flatMap(GasEstimate.toGasLimit)
 * )
 *
 * const gasLimit = Effect.runSync(program)
 *
 * // Use in transaction
 * const tx = { to: '0x...', gasLimit }
 * ```
 *
 * @see {@link from} to create estimate
 * @see {@link withBuffer} to add safety margin
 * @since 0.0.1
 */
export const toGasLimit = (estimate: GasEstimateType): Effect.Effect<GasLimitType, GasEstimateError> =>
  Effect.try({
    try: () => VoltaireGasEstimate.GasEstimate.toGasLimit(estimate) as GasLimitType,
    catch: (e) => e as GasEstimateError
  })
