/**
 * @fileoverview Factory function for creating BlockNumber values.
 * Provides Effect-based construction with typed error handling.
 *
 * @module BlockNumber/from
 * @since 0.0.1
 */

import { BlockNumber } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * Type alias for the branded BlockNumber type.
 * @internal
 */
type BlockNumberType = BlockNumber.BlockNumberType

/**
 * Error type for invalid block numbers.
 * @internal
 */
type InvalidBlockNumberError = BlockNumber.InvalidBlockNumberError

/**
 * Creates a BlockNumber from a number or bigint.
 *
 * @description
 * Constructs a branded `BlockNumberType` from a numeric value.
 * Validates that the input is non-negative (>= 0).
 *
 * This function never throws exceptions. Instead, it returns an Effect
 * that may fail with `InvalidBlockNumberError` if validation fails.
 *
 * @param {number | bigint} value - Non-negative number or bigint.
 *   Must be >= 0. Floating point numbers are not allowed.
 *
 * @returns {Effect.Effect<BlockNumberType, InvalidBlockNumberError>}
 *   Effect yielding `BlockNumberType` on success, or failing with
 *   `InvalidBlockNumberError` if value is negative.
 *
 * @throws {InvalidBlockNumberError} When value is negative or invalid.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as BlockNumber from 'voltaire-effect/primitives/BlockNumber'
 *
 * // From number
 * const blockNum = await Effect.runPromise(BlockNumber.from(12345))
 * ```
 *
 * @example
 * ```typescript
 * // From bigint
 * const blockNum = await Effect.runPromise(BlockNumber.from(12345n))
 * ```
 *
 * @example
 * ```typescript
 * // Handle negative values
 * const blockNum = await Effect.runPromise(
 *   BlockNumber.from(-1).pipe(
 *     Effect.catchTag('InvalidBlockNumberError', () =>
 *       Effect.succeed(BlockNumber.from(0))
 *     )
 *   )
 * )
 * ```
 *
 * @example
 * ```typescript
 * // Use in pipeline
 * const latestBlock = await Effect.runPromise(
 *   Effect.gen(function* () {
 *     const blockNum = yield* BlockNumber.from(rpcResponse.blockNumber)
 *     return blockNum
 *   })
 * )
 * ```
 *
 * @since 0.0.1
 * @see {@link BlockNumberSchema} for schema-based validation
 */
export const from = (value: number | bigint): Effect.Effect<BlockNumberType, InvalidBlockNumberError> =>
  Effect.try({
    try: () => BlockNumber.from(value),
    catch: (e) => e as InvalidBlockNumberError
  })
