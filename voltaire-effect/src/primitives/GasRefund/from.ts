/**
 * @fileoverview Effect-based constructor and utility functions for GasRefund primitive.
 * @module GasRefund/from
 * @since 0.0.1
 */

import { GasRefund } from '@tevm/voltaire'
import type { GasRefundType } from './GasRefundSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when gas refund operations fail.
 *
 * @description
 * Tagged error class for GasRefund operations. Includes the `_tag` property
 * for Effect's error handling and pattern matching.
 *
 * @example
 * ```typescript
 * import * as GasRefund from 'voltaire-effect/primitives/GasRefund'
 * import { Effect, pipe } from 'effect'
 *
 * const program = pipe(
 *   GasRefund.from(-1n),
 *   Effect.catchTag('GasRefundError', (e) => {
 *     console.error('Invalid refund:', e.message)
 *     return Effect.succeed(0n as GasRefund.GasRefundType)
 *   })
 * )
 * ```
 *
 * @since 0.0.1
 */
export class GasRefundError {
  readonly _tag = 'GasRefundError'
  constructor(readonly message: string) {}
}

/**
 * Creates a GasRefund from a numeric value.
 *
 * @description
 * Constructs a branded GasRefund within an Effect context.
 * Refunds are accumulated during EVM execution for storage clearing operations.
 *
 * @param value - Refund amount as bigint, number, or string
 * @returns Effect yielding GasRefundType on success, or GasRefundError on failure
 *
 * @throws {GasRefundError} When value cannot be converted
 * @throws {GasRefundError} When value is negative
 *
 * @example
 * ```typescript
 * import * as GasRefund from 'voltaire-effect/primitives/GasRefund'
 * import { Effect } from 'effect'
 *
 * // Create refund from SSTORE clearing operation
 * const refund = GasRefund.from(4800n)
 * const refundValue = Effect.runSync(refund)
 *
 * // Accumulate multiple refunds
 * const totalRefund = GasRefund.from(4800n * 3n) // 3 cleared slots
 * ```
 *
 * @see {@link Schema} for schema-based validation
 * @see {@link cappedRefund} to apply EIP-3529 cap
 * @since 0.0.1
 */
export const from = (value: bigint | number | string): Effect.Effect<GasRefundType, GasRefundError> =>
  Effect.try({
    try: () => GasRefund.from(value),
    catch: (e) => new GasRefundError((e as Error).message)
  })

/**
 * Calculates the capped refund per EIP-3529 (max refund is gasUsed/5).
 *
 * @description
 * EIP-3529 introduced a 20% cap on gas refunds to prevent gas token abuse
 * and reduce block processing time variability. This function applies
 * that cap: actualRefund = min(accumulatedRefund, gasUsed / 5).
 *
 * @param refund - Accumulated refund amount from execution
 * @param gasUsed - Total gas used in transaction
 * @returns Effect yielding capped refund amount
 *
 * @throws {GasRefundError} When calculation fails
 *
 * @example
 * ```typescript
 * import * as GasRefund from 'voltaire-effect/primitives/GasRefund'
 * import { Effect } from 'effect'
 *
 * // Refund exceeds cap
 * const capped1 = GasRefund.cappedRefund(30000n, 100000n)
 * // max = 100000/5 = 20000, so capped = 20000n
 *
 * // Refund under cap
 * const capped2 = GasRefund.cappedRefund(15000n, 100000n)
 * // max = 20000, refund = 15000, so capped = 15000n
 *
 * // Calculate net gas cost
 * const gasUsed = 100000n
 * const refund = 30000n
 * const cappedRefundValue = Effect.runSync(GasRefund.cappedRefund(refund, gasUsed))
 * const netGas = gasUsed - cappedRefundValue // 80000n
 * ```
 *
 * @see {@link from} to create refund
 * @see {@link GasUsed} for gas consumption
 * @since 0.0.1
 */
export const cappedRefund = (refund: bigint | number | string, gasUsed: bigint): Effect.Effect<GasRefundType, GasRefundError> =>
  Effect.try({
    try: () => GasRefund.cappedRefund(refund, gasUsed),
    catch: (e) => new GasRefundError((e as Error).message)
  })
