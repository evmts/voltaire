/**
 * @fileoverview Hex creation function with Effect error handling.
 * Converts strings and byte arrays to branded Hex types with proper validation.
 * @module voltaire-effect/primitives/Hex/from
 * @since 0.0.1
 */

import { Hex as VoltaireHex, type HexType } from '@tevm/voltaire/Hex'
import { InvalidFormatError, ValidationError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Creates a Hex value from a string or Uint8Array.
 *
 * @description
 * Converts input to a branded HexType with 0x prefix. Accepts hex strings
 * (with or without 0x prefix) and Uint8Array byte data. Returns an Effect
 * that fails with InvalidFormatError if the input is invalid.
 *
 * This is the primary constructor for Hex values in the Effect-based API.
 * For infallible conversion from bytes, use {@link fromBytes} instead.
 *
 * @param {string | Uint8Array} value - Input string (with or without 0x prefix) or byte array to convert
 * @returns {Effect.Effect<HexType, InvalidFormatError>} Effect yielding the branded HexType on success,
 *   or failing with InvalidFormatError if the input is not valid hex
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as Effect from 'effect/Effect'
 *
 * // From hex string with prefix
 * const hex1 = Hex.from('0xdeadbeef')
 * const result1 = await Effect.runPromise(hex1) // '0xdeadbeef'
 *
 * // From hex string without prefix
 * const hex2 = Hex.from('deadbeef')
 * const result2 = await Effect.runPromise(hex2) // '0xdeadbeef'
 *
 * // From Uint8Array
 * const hex3 = Hex.from(new Uint8Array([0xde, 0xad]))
 * const result3 = await Effect.runPromise(hex3) // '0xdead'
 *
 * // Handle errors with Effect
 * const result = await Effect.runPromise(
 *   Hex.from('not hex').pipe(
 *     Effect.catchTag('InvalidFormatError', (e) => Effect.succeed('fallback'))
 *   )
 * )
 * ```
 *
 * @throws {InvalidFormatError} When the input string contains invalid hex characters
 *   or has an odd number of characters (excluding 0x prefix)
 *
 * @see {@link fromBytes} - Infallible conversion from Uint8Array
 * @see {@link toBytes} - Convert Hex back to bytes
 * @see {@link Schema} - Effect Schema for parsing/validation
 *
 * @since 0.0.1
 */
export const from = (value: string | Uint8Array): Effect.Effect<HexType, InvalidFormatError> =>
  Effect.try({
    try: () => VoltaireHex(value),
    catch: (e) => {
      if (e instanceof InvalidFormatError) return e
      if (e instanceof ValidationError) {
        return new InvalidFormatError(e.message, { value, expected: 'valid hex string', cause: e })
      }
      return new InvalidFormatError(
        e instanceof Error ? e.message : String(e),
        { value, expected: 'valid hex string', cause: e instanceof Error ? e : undefined }
      )
    }
  })
