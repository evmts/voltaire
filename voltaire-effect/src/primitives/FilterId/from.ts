/**
 * @fileoverview Effect-based functions for creating filter IDs.
 * @module FilterId/from
 * @since 0.0.1
 *
 * @description
 * Provides Effect-wrapped operations for creating validated filter identifiers
 * used with Ethereum JSON-RPC filter methods.
 */

import { FilterId } from '@tevm/voltaire'
import type { FilterIdType } from './FilterIdSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when FilterId parsing fails.
 *
 * @description
 * This error occurs when attempting to create a filter ID from an invalid value,
 * such as a non-hex string or malformed identifier.
 *
 * @example
 * ```typescript
 * import * as FilterId from 'voltaire-effect/primitives/FilterId'
 * import * as Effect from 'effect/Effect'
 *
 * const result = FilterId.from('invalid')
 * Effect.runSync(Effect.either(result))
 * // Left(FilterIdError { message: 'Invalid filter ID format' })
 * ```
 *
 * @see {@link from} for the function that throws this error
 * @since 0.0.1
 */
export class FilterIdError {
  /** Discriminant tag for Effect error handling */
  readonly _tag = 'FilterIdError'

  /**
   * Creates a new FilterIdError.
   * @param message - Description of the validation failure
   */
  constructor(readonly message: string) {}
}

/**
 * Creates a FilterId from a string value.
 *
 * @description
 * Parses a hex-encoded filter ID string into a validated FilterIdType.
 * Filter IDs are returned by eth_newFilter, eth_newBlockFilter, and
 * eth_newPendingTransactionFilter.
 *
 * @param value - The filter ID string (hex format with 0x prefix)
 * @returns Effect containing FilterIdType or FilterIdError
 *
 * @example
 * ```typescript
 * import * as FilterId from 'voltaire-effect/primitives/FilterId'
 * import * as Effect from 'effect/Effect'
 *
 * // Create from JSON-RPC response
 * const id = Effect.runSync(FilterId.from('0x1'))
 *
 * // In Effect.gen
 * const program = Effect.gen(function* () {
 *   const filterId = yield* FilterId.from('0xabc')
 *   // Use with eth_getFilterChanges
 *   return filterId
 * })
 *
 * // Handle errors
 * const result = Effect.runSync(
 *   Effect.catchAll(FilterId.from('invalid'), (e) =>
 *     Effect.succeed(`Error: ${e.message}`)
 *   )
 * )
 * ```
 *
 * @throws {FilterIdError} When value is not a valid hex filter ID
 * @see {@link Schema} for Schema-based validation
 * @since 0.0.1
 */
export const from = (value: string): Effect.Effect<FilterIdType, FilterIdError> =>
  Effect.try({
    try: () => FilterId.from(value),
    catch: (e) => new FilterIdError((e as Error).message)
  })
