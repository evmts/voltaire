/**
 * @fileoverview Effect-wrapped functions for creating NetworkId instances.
 * Provides safe constructors that return Effect types for error handling.
 * @module NetworkId/from
 * @since 0.0.1
 */

import * as Effect from 'effect/Effect'
import type { NetworkIdType } from './NetworkIdSchema.js'

/**
 * Error thrown when NetworkId parsing fails due to invalid input.
 *
 * @description
 * Indicates that the provided value is not a valid network ID. Network IDs
 * must be non-negative integers (0 or greater).
 *
 * @example
 * ```typescript
 * import * as NetworkId from 'voltaire-effect/primitives/NetworkId'
 * import * as Effect from 'effect/Effect'
 *
 * const result = NetworkId.from(-1)
 * Effect.runSync(Effect.either(result))
 * // Left(InvalidNetworkIdError { value: -1, message: '...' })
 * ```
 *
 * @since 0.0.1
 */
export class InvalidNetworkIdError {
  readonly _tag = 'InvalidNetworkIdError'
  constructor(readonly value: unknown, readonly message: string) {}
}

/**
 * Creates a NetworkId from a number, wrapped in an Effect.
 *
 * @description
 * Validates and creates a NetworkIdType from a numeric input. The value
 * must be a non-negative integer. Network IDs are used for peer-to-peer
 * networking identification.
 *
 * @param value - The network ID value (must be a non-negative integer)
 * @returns An Effect that resolves to NetworkIdType or fails with InvalidNetworkIdError
 *
 * @example
 * ```typescript
 * import * as NetworkId from 'voltaire-effect/primitives/NetworkId'
 * import * as Effect from 'effect/Effect'
 *
 * // Create Mainnet network ID
 * const mainnet = Effect.runSync(NetworkId.from(1))
 *
 * // Create Sepolia network ID
 * const sepolia = Effect.runSync(NetworkId.from(11155111))
 *
 * // Use in Effect pipeline
 * const program = Effect.gen(function* () {
 *   const networkId = yield* NetworkId.from(userInput)
 *   return networkId
 * })
 * ```
 *
 * @throws InvalidNetworkIdError - When the value is negative or not an integer
 * @see {@link NetworkIdSchema} for schema-based validation
 * @since 0.0.1
 */
export const from = (value: number): Effect.Effect<NetworkIdType, InvalidNetworkIdError> =>
  Effect.try({
    try: () => {
      if (!Number.isInteger(value) || value < 0) {
        throw new Error(`Network ID must be a non-negative integer, got ${value}`)
      }
      return value as NetworkIdType
    },
    catch: (e) => new InvalidNetworkIdError(value, (e as Error).message)
  })
