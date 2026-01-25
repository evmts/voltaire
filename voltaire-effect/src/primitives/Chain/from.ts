import * as Effect from 'effect/Effect'
import type { ChainType, ChainInput } from './ChainSchema.js'

/**
 * Error thrown when chain validation fails.
 * @since 0.0.1
 */
export class InvalidChainError {
  readonly _tag = 'InvalidChainError'
  constructor(readonly value: unknown, readonly message: string) {}
}

/**
 * Creates a Chain from input configuration.
 *
 * @param value - Chain configuration input
 * @returns Effect yielding ChainType or failing with InvalidChainError
 * @example
 * ```typescript
 * import * as Chain from 'voltaire-effect/Chain'
 * import { Effect } from 'effect'
 *
 * const program = Chain.from({
 *   id: 1,
 *   name: 'Ethereum',
 *   nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
 * })
 * const chain = Effect.runSync(program)
 * ```
 * @since 0.0.1
 */
export const from = (value: ChainInput): Effect.Effect<ChainType, InvalidChainError> =>
  Effect.try({
    try: () => {
      if (typeof value.id !== 'number' || value.id <= 0) {
        throw new Error(`Chain ID must be a positive integer, got ${value.id}`)
      }
      if (typeof value.name !== 'string' || value.name.length === 0) {
        throw new Error(`Chain name must be a non-empty string`)
      }
      if (!value.nativeCurrency || typeof value.nativeCurrency.symbol !== 'string') {
        throw new Error(`Chain must have a valid native currency`)
      }
      return {
        __tag: 'Chain' as const,
        ...value
      } as ChainType
    },
    catch: (e) => new InvalidChainError(value, (e as Error).message)
  })
