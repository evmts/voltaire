/**
 * @fileoverview Effect-wrapped functions for creating Balance instances.
 * Provides safe constructors that return Effect types for error handling.
 * @module Balance/from
 * @since 0.0.1
 */

import { Uint } from '@tevm/voltaire'
import type { BalanceType } from './BalanceSchema.js'
import type { UintError } from '../Uint/from.js'
import * as Effect from 'effect/Effect'

/**
 * Creates a Balance from a bigint, number, or string, wrapped in an Effect.
 *
 * @description
 * Validates and creates a BalanceType from numeric input. The value must be
 * non-negative as balances cannot be negative in Ethereum. Balances represent
 * Wei amounts (1 ETH = 10^18 Wei).
 *
 * @param value - The balance value (must be a non-negative integer)
 * @returns An Effect that resolves to BalanceType or fails with UintError
 *
 * @example
 * ```typescript
 * import * as Balance from 'voltaire-effect/primitives/Balance'
 * import * as Effect from 'effect/Effect'
 *
 * // Create from bigint (1 ETH in Wei)
 * const balance1 = Effect.runSync(Balance.from(1000000000000000000n))
 *
 * // Create from number
 * const balance2 = Effect.runSync(Balance.from(1000000))
 *
 * // Create from string
 * const balance3 = Effect.runSync(Balance.from('1000000000000000000'))
 *
 * // Handle errors with Effect
 * const program = Effect.gen(function* () {
 *   const balance = yield* Balance.from(userInput)
 *   return balance
 * })
 * ```
 *
 * @throws UintError - When the value is negative or cannot be converted
 * @see {@link BalanceSchema} for schema-based validation
 * @since 0.0.1
 */
export const from = (value: bigint | number | string): Effect.Effect<BalanceType, UintError> =>
  Effect.try({
    try: () => Uint.from(value) as unknown as BalanceType,
    catch: (e) => e as UintError
  })
