import { GasUsed } from '@tevm/voltaire'
import type { GasUsedType } from './GasUsedSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when gas used operations fail.
 * @since 0.0.1
 */
export class GasUsedError {
  readonly _tag = 'GasUsedError'
  constructor(readonly message: string) {}
}

/**
 * Creates a GasUsed value from a numeric input.
 * @param value - Gas used amount as bigint, number, or string
 * @returns Effect containing GasUsedType or error
 * @example
 * ```ts
 * import * as GasUsed from 'voltaire-effect/primitives/GasUsed'
 *
 * const used = GasUsed.from(21000n)
 * ```
 * @since 0.0.1
 */
export const from = (value: bigint | number | string): Effect.Effect<GasUsedType, GasUsedError> =>
  Effect.try({
    try: () => GasUsed.from(value),
    catch: (e) => new GasUsedError((e as Error).message)
  })

/**
 * Calculates the total cost from gas used and gas price.
 * @param gasUsed - Amount of gas consumed
 * @param gasPrice - Price per gas unit in wei
 * @returns Effect containing total cost in wei
 * @example
 * ```ts
 * import * as GasUsed from 'voltaire-effect/primitives/GasUsed'
 *
 * const cost = GasUsed.calculateCost(21000n, 1000000000n) // 21000 gwei
 * ```
 * @since 0.0.1
 */
export const calculateCost = (gasUsed: bigint | number | string, gasPrice: bigint): Effect.Effect<bigint, GasUsedError> =>
  Effect.try({
    try: () => GasUsed.calculateCost(gasUsed, gasPrice),
    catch: (e) => new GasUsedError((e as Error).message)
  })
