/**
 * @fileoverview Effect-wrapped functions for creating ChainId instances.
 * Provides safe constructors that return Effect types for error handling.
 * @module ChainId/from
 * @since 0.0.1
 */

import * as Effect from 'effect/Effect'
import type { ChainIdType } from './ChainIdSchema.js'

/**
 * Error thrown when ChainId validation fails.
 *
 * @description
 * Indicates that the provided value is not a valid chain ID. Chain IDs
 * must be positive integers.
 *
 * @example
 * ```typescript
 * import * as ChainId from 'voltaire-effect/primitives/ChainId'
 * import * as Effect from 'effect/Effect'
 *
 * const result = Effect.runSyncExit(ChainId.from(-1))
 * // Exit.Failure with InvalidChainIdError
 * ```
 *
 * @since 0.0.1
 */
export class InvalidChainIdError {
  readonly _tag = 'InvalidChainIdError'
  constructor(readonly value: unknown, readonly message: string) {}
}

/**
 * Creates a ChainId from a numeric value.
 *
 * @description
 * Validates and creates a ChainIdType from a numeric input. The value
 * must be a positive integer. Chain IDs uniquely identify Ethereum networks.
 *
 * @param value - Positive integer chain ID
 * @returns Effect yielding ChainIdType or failing with InvalidChainIdError
 *
 * @example
 * ```typescript
 * import * as ChainId from 'voltaire-effect/primitives/ChainId'
 * import * as Effect from 'effect/Effect'
 *
 * // Ethereum mainnet
 * const mainnet = Effect.runSync(ChainId.from(1))
 *
 * // Sepolia testnet
 * const sepolia = Effect.runSync(ChainId.from(11155111))
 *
 * // Use in Effect pipeline
 * const program = Effect.gen(function* () {
 *   const chainId = yield* ChainId.from(userInput)
 *   return chainId
 * })
 * ```
 *
 * @throws InvalidChainIdError - When the value is not a positive integer
 * @see {@link ChainIdSchema} for schema-based validation
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
