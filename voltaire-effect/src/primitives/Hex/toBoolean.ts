/**
 * @fileoverview Hex toBoolean function with Effect error handling.
 * Converts hex strings to booleans with proper validation.
 * @module voltaire-effect/primitives/Hex/toBoolean
 * @since 0.0.1
 */

import { Hex as VoltaireHex, type HexType } from '@tevm/voltaire/Hex'
import { InvalidFormatError, ValidationError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Converts a Hex value to a boolean.
 *
 * @description
 * Interprets a hex string as a boolean value. `0x00` (or `0x`) is
 * interpreted as `false`, and any non-zero value is interpreted as
 * `true`. Returns an Effect that fails with InvalidFormatError if
 * the hex is malformed.
 *
 * @param {HexType | string} hex - Hex string to convert
 * @returns {Effect.Effect<boolean, InvalidFormatError>} Effect yielding the boolean on success,
 *   or failing with InvalidFormatError if the hex is malformed
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as Effect from 'effect/Effect'
 *
 * // true values
 * const bool1 = await Effect.runPromise(Hex.toBoolean('0x01')) // true
 * const bool2 = await Effect.runPromise(Hex.toBoolean('0xff')) // true
 *
 * // false values
 * const bool3 = await Effect.runPromise(Hex.toBoolean('0x00')) // false
 * const bool4 = await Effect.runPromise(Hex.toBoolean('0x')) // false
 *
 * // Handle errors
 * const result = await Effect.runPromise(
 *   Hex.toBoolean('invalid').pipe(
 *     Effect.catchTag('InvalidFormatError', () => Effect.succeed(false))
 *   )
 * )
 * ```
 *
 * @throws {InvalidFormatError} When the hex string is malformed
 *
 * @see {@link fromBoolean} - Create Hex from boolean
 *
 * @since 0.0.1
 */
export const toBoolean = (hex: HexType | string): Effect.Effect<boolean, InvalidFormatError> =>
  Effect.try({
    try: () => VoltaireHex.toBoolean(hex as HexType),
    catch: (e) => {
      if (e instanceof InvalidFormatError) return e
      if (e instanceof ValidationError) {
        return new InvalidFormatError(e.message, { value: hex, expected: 'valid hex string', cause: e })
      }
      return new InvalidFormatError(
        e instanceof Error ? e.message : String(e),
        { value: hex, expected: 'valid hex string', cause: e instanceof Error ? e : undefined }
      )
    }
  })
