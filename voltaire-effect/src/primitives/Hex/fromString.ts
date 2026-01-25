/**
 * @fileoverview Hex fromString function with Effect error handling.
 * Converts UTF-8 strings to hex representation.
 * @module voltaire-effect/primitives/Hex/fromString
 * @since 0.0.1
 */

import { Hex as VoltaireHex, type HexType } from '@tevm/voltaire/Hex'
import { InvalidFormatError, ValidationError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Creates a Hex value from a UTF-8 string.
 *
 * @description
 * Encodes a UTF-8 string as hex. Each character is converted to its
 * UTF-8 byte representation, then those bytes are hex-encoded. Returns
 * an Effect that fails with InvalidFormatError if encoding fails.
 *
 * Note: This is different from {@link from} which expects a hex string.
 * This function treats the input as raw UTF-8 text to be hex-encoded.
 *
 * @param {string} value - UTF-8 string to encode as hex
 * @returns {Effect.Effect<HexType, InvalidFormatError>} Effect yielding the branded HexType on success,
 *   or failing with InvalidFormatError if encoding fails
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as Effect from 'effect/Effect'
 *
 * // ASCII string
 * const hex1 = await Effect.runPromise(Hex.fromString('hello'))
 * // '0x68656c6c6f'
 *
 * // Unicode string
 * const hex2 = await Effect.runPromise(Hex.fromString('🦊'))
 * // '0xf09fa68a'
 *
 * // Empty string
 * const hex3 = await Effect.runPromise(Hex.fromString(''))
 * // '0x'
 * ```
 *
 * @throws {InvalidFormatError} When string encoding fails
 *
 * @see {@link from} - Create Hex from hex string or bytes
 * @see {@link toString} - Convert Hex back to UTF-8 string
 *
 * @since 0.0.1
 */
export const fromString = (value: string): Effect.Effect<HexType, InvalidFormatError> =>
  Effect.try({
    try: () => VoltaireHex.fromString(value),
    catch: (e) => {
      if (e instanceof InvalidFormatError) return e
      if (e instanceof ValidationError) {
        return new InvalidFormatError(e.message, { value, expected: 'valid string', cause: e })
      }
      return new InvalidFormatError(
        e instanceof Error ? e.message : String(e),
        { value, expected: 'valid string', cause: e instanceof Error ? e : undefined }
      )
    }
  })
