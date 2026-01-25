/**
 * @fileoverview Hex size assertion function with Effect error handling.
 * Asserts that a hex string has a specific byte size.
 * @module voltaire-effect/primitives/Hex/assertSize
 * @since 0.0.1
 */

import { Hex as VoltaireHex, type HexType, type Sized } from '@tevm/voltaire/Hex'
import { InvalidLengthError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Assert that a hex string has a specific byte size.
 *
 * @description
 * Validates that a hex string is exactly the specified size in bytes.
 * Returns the hex as a Sized type on success, or fails with InvalidLengthError
 * if the size doesn't match.
 *
 * @param {HexType} hex - Hex string to check
 * @param {number} targetSize - Expected size in bytes
 * @returns {Effect.Effect<Sized<TSize>, InvalidLengthError>} Effect yielding sized hex,
 *   or failing with InvalidLengthError
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as Effect from 'effect/Effect'
 *
 * // Returns Sized<2> on success
 * const sized = await Effect.runPromise(Hex.assertSize('0x1234', 2))
 *
 * // Fails if size doesn't match
 * const result = await Effect.runPromise(
 *   Hex.assertSize('0x1234', 4).pipe(
 *     Effect.catchTag('InvalidLengthError', () => Effect.succeed('wrong size'))
 *   )
 * )
 * ```
 *
 * @since 0.0.1
 */
export const assertSize = <TSize extends number>(
  hex: HexType,
  targetSize: TSize
): Effect.Effect<Sized<TSize>, InvalidLengthError> =>
  Effect.try({
    try: () => VoltaireHex.assertSize(hex, targetSize),
    catch: (e) => {
      if (e instanceof InvalidLengthError) return e
      return new InvalidLengthError(
        e instanceof Error ? e.message : String(e),
        { value: hex, expected: `${targetSize} bytes`, cause: e instanceof Error ? e : undefined }
      )
    }
  })
