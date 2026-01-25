import * as Effect from 'effect/Effect'
import type { ChainIdType } from './ChainIdSchema.js'

/**
 * Error thrown when ChainId validation fails.
 * @since 0.0.1
 */
export class InvalidChainIdError {
  readonly _tag = 'InvalidChainIdError'
  constructor(readonly value: unknown, readonly message: string) {}
}

/**
 * Creates a ChainId from a numeric value.
 *
 * @param value - Positive integer chain ID
 * @returns Effect yielding ChainIdType or failing with InvalidChainIdError
 * @example
 * ```typescript
 * import * as ChainId from 'voltaire-effect/ChainId'
 * import { Effect } from 'effect'
 *
 * const program = ChainId.from(1) // Ethereum mainnet
 * const id = Effect.runSync(program)
 * ```
 * @since 0.0.1
 */
export const from = (value: number): Effect.Effect<ChainIdType, InvalidChainIdError> =>
  Effect.try({
    try: () => {
      if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`Chain ID must be a positive integer, got ${value}`)
      }
      return value as ChainIdType
    },
    catch: (e) => new InvalidChainIdError(value, (e as Error).message)
  })
