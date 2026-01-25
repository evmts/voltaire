/**
 * @fileoverview Effect-based constructor and utility functions for FeeOracle primitive.
 * @module FeeOracle/from
 * @since 0.0.1
 */

import * as Effect from 'effect/Effect'
import type { FeeOracleInput, FeeOracleType } from './FeeOracleSchema.js'

/**
 * Error thrown when FeeOracle operations fail.
 *
 * @description
 * Tagged error class for FeeOracle operations. Includes the `_tag` property
 * for Effect's error handling and pattern matching.
 *
 * @since 0.0.1
 */
export class FeeOracleError extends Error {
  readonly _tag = 'FeeOracleError'
  constructor(message: string) {
    super(message)
    this.name = 'FeeOracleError'
  }
}

/**
 * Creates a FeeOracle from input values.
 *
 * @description
 * Constructs a normalized FeeOracleType from flexible input types.
 * Use with fee estimation services or manual fee configuration.
 *
 * @param input - Fee oracle input with fee parameters
 * @returns Effect yielding FeeOracleType on success
 *
 * @throws {FeeOracleError} When any value cannot be converted to bigint
 *
 * @example
 * ```typescript
 * import * as FeeOracle from 'voltaire-effect/primitives/FeeOracle'
 * import { Effect } from 'effect'
 *
 * const fees = FeeOracle.from({
 *   baseFee: 20_000_000_000n,
 *   priorityFee: 2_000_000_000n,
 *   maxFee: 50_000_000_000n,
 *   estimatedTime: 12
 * })
 *
 * const feeData = Effect.runSync(fees)
 * ```
 *
 * @see {@link FeeOracleSchema} for schema validation
 * @see {@link validate} to verify fee parameters
 * @since 0.0.1
 */
export const from = (input: FeeOracleInput): Effect.Effect<FeeOracleType, FeeOracleError> =>
  Effect.try({
    try: () => {
      const result: FeeOracleType = {
        baseFee: BigInt(input.baseFee),
        priorityFee: BigInt(input.priorityFee),
        maxFee: BigInt(input.maxFee),
      }
      if (input.gasPrice !== undefined) {
        (result as any).gasPrice = BigInt(input.gasPrice)
      }
      if (input.estimatedTime !== undefined) {
        (result as any).estimatedTime = input.estimatedTime
      }
      return result
    },
    catch: (e) => new FeeOracleError((e as Error).message)
  })

/**
 * Validates fee oracle parameters for correctness.
 *
 * @description
 * Ensures fee parameters are valid for EIP-1559 transactions:
 * - All values must be non-negative
 * - maxFee must be >= baseFee + priorityFee
 *
 * @param fee - Fee oracle data to validate
 * @returns Effect that succeeds if valid, fails with FeeOracleError otherwise
 *
 * @throws {FeeOracleError} When validation fails
 *
 * @example
 * ```typescript
 * import * as FeeOracle from 'voltaire-effect/primitives/FeeOracle'
 * import { Effect, pipe } from 'effect'
 *
 * const program = pipe(
 *   FeeOracle.from({ baseFee: 20n, priorityFee: 2n, maxFee: 30n }),
 *   Effect.flatMap(FeeOracle.validate),
 *   Effect.map(() => 'Valid fee parameters!')
 * )
 * ```
 *
 * @see {@link from} to create fee oracle
 * @since 0.0.1
 */
export const validate = (fee: FeeOracleType): Effect.Effect<void, FeeOracleError> =>
  Effect.try({
    try: () => {
      if (fee.baseFee < 0n) throw new Error('baseFee must be non-negative')
      if (fee.priorityFee < 0n) throw new Error('priorityFee must be non-negative')
      if (fee.maxFee < 0n) throw new Error('maxFee must be non-negative')
      if (fee.maxFee < fee.baseFee + fee.priorityFee) {
        throw new Error('maxFee must be >= baseFee + priorityFee')
      }
    },
    catch: (e) => new FeeOracleError((e as Error).message)
  })

/**
 * Calculates the effective gas price from fee oracle parameters.
 *
 * @description
 * Computes: min(baseFee + priorityFee, maxFee)
 * This is what the user will actually pay per gas unit.
 *
 * @param fee - Fee oracle data
 * @returns Effect yielding the effective gas price in wei
 *
 * @example
 * ```typescript
 * import * as FeeOracle from 'voltaire-effect/primitives/FeeOracle'
 * import { Effect } from 'effect'
 *
 * const fees = Effect.runSync(FeeOracle.from({
 *   baseFee: 20_000_000_000n,
 *   priorityFee: 2_000_000_000n,
 *   maxFee: 50_000_000_000n
 * }))
 *
 * const effective = Effect.runSync(FeeOracle.effectiveGasPrice(fees))
 * // effective = 22_000_000_000n (22 gwei)
 * ```
 *
 * @see {@link EffectiveGasPrice} for the effective price type
 * @since 0.0.1
 */
export const effectiveGasPrice = (
  fee: FeeOracleType
): Effect.Effect<bigint, never> => {
  const effective = fee.baseFee + fee.priorityFee
  return Effect.succeed(effective > fee.maxFee ? fee.maxFee : effective)
}

/**
 * Scales fee oracle values by a multiplier.
 *
 * @description
 * Applies a multiplier to maxFee and priorityFee for fee adjustment.
 * Useful for implementing "fast", "standard", "slow" fee tiers.
 *
 * @param fee - Base fee oracle data
 * @param multiplier - Multiplier to apply (e.g., 1.2 for +20%)
 * @returns Effect yielding scaled FeeOracleType
 *
 * @throws {FeeOracleError} When calculation fails
 *
 * @example
 * ```typescript
 * import * as FeeOracle from 'voltaire-effect/primitives/FeeOracle'
 * import { Effect } from 'effect'
 *
 * const baseFees = Effect.runSync(FeeOracle.from({
 *   baseFee: 20_000_000_000n,
 *   priorityFee: 2_000_000_000n,
 *   maxFee: 50_000_000_000n
 * }))
 *
 * // Fast tier: +50% fees
 * const fastFees = Effect.runSync(FeeOracle.withMultiplier(baseFees, 1.5))
 *
 * // Slow tier: -20% fees
 * const slowFees = Effect.runSync(FeeOracle.withMultiplier(baseFees, 0.8))
 * ```
 *
 * @see {@link from} to create base fee oracle
 * @since 0.0.1
 */
export const withMultiplier = (
  fee: FeeOracleType,
  multiplier: number
): Effect.Effect<FeeOracleType, FeeOracleError> =>
  Effect.try({
    try: () => ({
      ...fee,
      maxFee: BigInt(Math.floor(Number(fee.maxFee) * multiplier)),
      priorityFee: BigInt(Math.floor(Number(fee.priorityFee) * multiplier)),
    }),
    catch: (e) => new FeeOracleError((e as Error).message)
  })
