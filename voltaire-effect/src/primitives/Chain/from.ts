/**
 * @fileoverview Effect-wrapped functions for creating Chain instances.
 * Provides safe constructors that return Effect types for error handling.
 * @module Chain/from
 * @since 0.0.1
 */

import * as Effect from 'effect/Effect'
import type { ChainType, ChainInput } from './ChainSchema.js'

/**
 * Error thrown when chain validation fails.
 *
 * @description
 * Indicates that the provided chain configuration is invalid. This could
 * be due to a non-positive chain ID, empty name, or missing native currency.
 *
 * @example
 * ```typescript
 * import * as Chain from 'voltaire-effect/primitives/Chain'
 * import * as Effect from 'effect/Effect'
 *
 * const result = Effect.runSyncExit(Chain.from({ id: 0, name: '', nativeCurrency: null }))
 * // Exit.Failure with InvalidChainError
 * ```
 *
 * @since 0.0.1
 */
export class InvalidChainError {
  readonly _tag = 'InvalidChainError'
  constructor(readonly value: unknown, readonly message: string) {}
}

/**
 * Creates a Chain from input configuration.
 *
 * @description
 * Validates and creates a ChainType from chain configuration input.
 * Performs validation to ensure the chain ID is positive, name is non-empty,
 * and native currency is properly configured.
 *
 * @param value - Chain configuration input (id, name, nativeCurrency, optional rpcUrls/explorers)
 * @returns Effect yielding ChainType or failing with InvalidChainError
 *
 * @example
 * ```typescript
 * import * as Chain from 'voltaire-effect/primitives/Chain'
 * import * as Effect from 'effect/Effect'
 *
 * // Create Ethereum mainnet
 * const ethereum = Chain.from({
 *   id: 1,
 *   name: 'Ethereum',
 *   nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
 * })
 * const chain = Effect.runSync(ethereum)
 *
 * // Use in Effect pipeline
 * const program = Effect.gen(function* () {
 *   const mainnet = yield* Chain.from({ id: 1, name: 'Ethereum', ... })
 *   const sepolia = yield* Chain.from({ id: 11155111, name: 'Sepolia', ... })
 *   return { mainnet, sepolia }
 * })
 * ```
 *
 * @throws InvalidChainError - When chain ID is invalid, name is empty, or currency is missing
 * @see {@link ChainSchema} for schema-based validation
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
