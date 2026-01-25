import { Epoch } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import type { EpochType } from './EpochSchema.js'

/**
 * Error thrown when epoch operations fail.
 * @since 0.0.1
 */
export class EpochError extends Error {
  readonly _tag = 'EpochError'
  constructor(message: string) {
    super(message)
    this.name = 'EpochError'
  }
}

/**
 * Creates an Epoch from numeric input.
 *
 * @param value - Epoch number
 * @returns Effect yielding EpochType or failing with EpochError
 * @example
 * ```typescript
 * import * as Epoch from 'voltaire-effect/Epoch'
 * import { Effect } from 'effect'
 *
 * const program = Epoch.from(123456n)
 * const epoch = Effect.runSync(program)
 * ```
 * @since 0.0.1
 */
export const from = (value: bigint | number | string): Effect.Effect<EpochType, EpochError> =>
  Effect.try({
    try: () => Epoch.from(value),
    catch: (e) => new EpochError((e as Error).message)
  })

/**
 * Converts an Epoch to number.
 *
 * @param epoch - The epoch
 * @returns Effect yielding number
 * @since 0.0.1
 */
export const toNumber = (epoch: EpochType): Effect.Effect<number, never> =>
  Effect.succeed(Epoch.toNumber(epoch as any))

/**
 * Converts an Epoch to bigint.
 *
 * @param epoch - The epoch
 * @returns Effect yielding bigint
 * @since 0.0.1
 */
export const toBigInt = (epoch: EpochType): Effect.Effect<bigint, never> =>
  Effect.succeed(Epoch.toBigInt(epoch as any))

/**
 * Compares two epochs for equality.
 *
 * @param a - First epoch
 * @param b - Second epoch
 * @returns Effect yielding true if equal
 * @since 0.0.1
 */
export const equals = (a: EpochType, b: EpochType): Effect.Effect<boolean, never> =>
  Effect.succeed(Epoch.equals(a as any, b as any))

/**
 * Converts an Epoch to its starting slot number.
 *
 * @param epoch - The epoch
 * @returns Effect yielding slot number
 * @since 0.0.1
 */
export const toSlot = (epoch: EpochType): Effect.Effect<bigint, never> =>
  Effect.succeed(Epoch.toSlot(epoch as any))
