import { GasRefund } from '@tevm/voltaire'
import type { GasRefundType } from './GasRefundSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when gas refund operations fail.
 * @since 0.0.1
 */
export class GasRefundError {
  readonly _tag = 'GasRefundError'
  constructor(readonly message: string) {}
}

/**
 * Creates a GasRefund from a numeric value.
 * @param value - Refund amount as bigint, number, or string
 * @returns Effect containing GasRefundType or error
 * @example
 * ```ts
 * import * as GasRefund from 'voltaire-effect/primitives/GasRefund'
 *
 * const refund = GasRefund.from(15000n)
 * ```
 * @since 0.0.1
 */
export const from = (value: bigint | number | string): Effect.Effect<GasRefundType, GasRefundError> =>
  Effect.try({
    try: () => GasRefund.from(value),
    catch: (e) => new GasRefundError((e as Error).message)
  })

/**
 * Calculates the capped refund per EIP-3529 (max refund is gasUsed/5).
 * @param refund - Accumulated refund amount
 * @param gasUsed - Total gas used in transaction
 * @returns Effect containing capped refund amount
 * @example
 * ```ts
 * import * as GasRefund from 'voltaire-effect/primitives/GasRefund'
 *
 * const capped = GasRefund.cappedRefund(30000n, 100000n) // max 20000
 * ```
 * @since 0.0.1
 */
export const cappedRefund = (refund: bigint | number | string, gasUsed: bigint): Effect.Effect<GasRefundType, GasRefundError> =>
  Effect.try({
    try: () => GasRefund.cappedRefund(refund, gasUsed),
    catch: (e) => new GasRefundError((e as Error).message)
  })
