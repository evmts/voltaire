/**
 * @fileoverview Effect-wrapped functions for creating Nonce instances.
 * Provides safe constructors that return Effect types for error handling.
 * @module Nonce/from
 * @since 0.0.1
 */

import { Uint } from '@tevm/voltaire'
import type { NonceType } from './NonceSchema.js'
import type { UintError } from '../Uint/from.js'
import * as Effect from 'effect/Effect'

/**
 * Creates a Nonce from a bigint, number, or string, wrapped in an Effect.
 *
 * @description
 * Validates and creates a NonceType from numeric input. Nonces must be
 * non-negative integers that represent the transaction count for an account.
 * The first transaction from an account has nonce 0.
 *
 * @param value - The nonce value (must be a non-negative integer)
 * @returns An Effect that resolves to NonceType or fails with UintError
 *
 * @example
 * ```typescript
 * import * as Nonce from 'voltaire-effect/primitives/Nonce'
 * import * as Effect from 'effect/Effect'
 *
 * // Create a nonce from bigint
 * const nonce = Effect.runSync(Nonce.from(42n))
 *
 * // Create a nonce from number
 * const fromNumber = Effect.runSync(Nonce.from(0))
 *
 * // Create a nonce from string
 * const fromString = Effect.runSync(Nonce.from('100'))
 *
 * // Use in Effect pipeline
 * const program = Effect.gen(function* () {
 *   const nonce = yield* Nonce.from(userInput)
 *   return nonce
 * })
 * ```
 *
 * @throws UintError - When the value is negative or cannot be converted
 * @see {@link NonceSchema} for schema-based validation
 * @since 0.0.1
 */
export const from = (value: bigint | number | string): Effect.Effect<NonceType, UintError> =>
  Effect.try({
    try: () => Uint.from(value) as unknown as NonceType,
    catch: (e) => e as UintError
  })
