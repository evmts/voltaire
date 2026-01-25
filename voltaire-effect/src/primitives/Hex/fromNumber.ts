/**
 * @fileoverview Hex fromNumber function with Effect error handling.
 * Converts numbers to hex strings with proper validation.
 * @module voltaire-effect/primitives/Hex/fromNumber
 * @since 0.0.1
 */

import { Hex as VoltaireHex, type HexType } from '@tevm/voltaire/Hex'
import { InvalidFormatError, ValidationError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Creates a Hex value from a number.
 *
 * @description
 * Converts a number to a branded HexType with 0x prefix. Optionally pads
 * the result to a specific byte size. Returns an Effect that fails with
 * InvalidFormatError if the input is invalid (e.g., negative, non-integer,
 * or too large for the specified size).
 *
 * @param {number} value - Number to convert to hex
 * @param {number} [size] - Optional byte size to pad the result to
 * @returns {Effect.Effect<HexType, InvalidFormatError>} Effect yielding the branded HexType on success,
 *   or failing with InvalidFormatError if the input is invalid
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as Effect from 'effect/Effect'
 *
 * // Simple conversion
 * const hex1 = await Effect.runPromise(Hex.fromNumber(255)) // '0xff'
 *
 * // With size padding
 * const hex2 = await Effect.runPromise(Hex.fromNumber(255, 4)) // '0x000000ff'
 *
 * // Handle errors
 * const result = await Effect.runPromise(
 *   Hex.fromNumber(-1).pipe(
 *     Effect.catchTag('InvalidFormatError', (e) => Effect.succeed('0x00'))
 *   )
 * )
 * ```
 *
 * @throws {InvalidFormatError} When the input is negative, non-integer, or too large for size
 *
 * @see {@link from} - Create Hex from string or bytes
 * @see {@link toNumber} - Convert Hex back to number
 *
 * @since 0.0.1
 */
export const fromNumber = (value: number, size?: number): Effect.Effect<HexType, InvalidFormatError> =>
  Effect.try({
    try: () => VoltaireHex.fromNumber(value, size),
    catch: (e) => {
      if (e instanceof InvalidFormatError) return e
      if (e instanceof ValidationError) {
        return new InvalidFormatError(e.message, { value, expected: 'valid number', cause: e })
      }
      return new InvalidFormatError(
        e instanceof Error ? e.message : String(e),
        { value, expected: 'valid number', cause: e instanceof Error ? e : undefined }
      )
    }
  })
