import { GasEstimate as VoltaireGasEstimate, Gas } from '@tevm/voltaire'
import type { GasEstimateType } from './GasEstimateSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Branded type for gas limits.
 * @since 0.0.1
 */
export type GasLimitType = Gas.GasLimitType

/**
 * Error type for gas estimate operations.
 * @since 0.0.1
 */
export type GasEstimateError = Error

/**
 * Creates a GasEstimate from a numeric value.
 * @param value - Gas estimate as bigint, number, or string
 * @returns Effect containing GasEstimateType or error
 * @example
 * ```ts
 * import * as GasEstimate from 'voltaire-effect/primitives/GasEstimate'
 *
 * const estimate = GasEstimate.from(21000n)
 * ```
 * @since 0.0.1
 */
export const from = (value: bigint | number | string): Effect.Effect<GasEstimateType, GasEstimateError> =>
  Effect.try({
    try: () => VoltaireGasEstimate.GasEstimate.from(value),
    catch: (e) => e as GasEstimateError
  })

/**
 * Adds a percentage buffer to a gas estimate for safety margin.
 * @param estimate - Base gas estimate
 * @param percentageBuffer - Buffer percentage (e.g., 20 for 20%)
 * @returns Effect containing buffered estimate
 * @example
 * ```ts
 * import * as GasEstimate from 'voltaire-effect/primitives/GasEstimate'
 *
 * const buffered = GasEstimate.withBuffer(estimate, 20) // +20% buffer
 * ```
 * @since 0.0.1
 */
export const withBuffer = (estimate: GasEstimateType, percentageBuffer: number): Effect.Effect<GasEstimateType, GasEstimateError> =>
  Effect.try({
    try: () => VoltaireGasEstimate.GasEstimate.withBuffer(estimate, percentageBuffer),
    catch: (e) => e as GasEstimateError
  })

/**
 * Converts a gas estimate to a gas limit for transaction submission.
 * @param estimate - Gas estimate to convert
 * @returns Effect containing GasLimitType
 * @example
 * ```ts
 * import * as GasEstimate from 'voltaire-effect/primitives/GasEstimate'
 *
 * const limit = GasEstimate.toGasLimit(estimate)
 * ```
 * @since 0.0.1
 */
export const toGasLimit = (estimate: GasEstimateType): Effect.Effect<GasLimitType, GasEstimateError> =>
  Effect.try({
    try: () => VoltaireGasEstimate.GasEstimate.toGasLimit(estimate) as GasLimitType,
    catch: (e) => e as GasEstimateError
  })
