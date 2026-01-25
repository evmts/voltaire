/**
 * @fileoverview Hex trim function with Effect error handling.
 * Trims leading zeros from a hex string.
 * @module voltaire-effect/primitives/Hex/trim
 * @since 0.0.1
 */

import { Hex as VoltaireHex, type HexType } from '@tevm/voltaire/Hex'
import { InvalidFormatError, InvalidLengthError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Trim leading zeros from a hex string.
 *
 * @description
 * Removes leading zero bytes from a hex string. The 0x prefix is preserved.
 * An all-zeros hex becomes '0x'.
 *
 * @param {HexType} hex - Hex string to trim
 * @returns {Effect.Effect<HexType, InvalidFormatError | InvalidLengthError>} Effect yielding
 *   the trimmed hex string, or failing with error
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as Effect from 'effect/Effect'
 *
 * const trimmed = await Effect.runPromise(Hex.trim('0x00001234')) // '0x1234'
 * ```
 *
 * @since 0.0.1
 */
export const trim = (
  hex: HexType
): Effect.Effect<HexType, InvalidFormatError | InvalidLengthError> =>
  Effect.try({
    try: () => VoltaireHex.trim(hex),
    catch: (e) => {
      if (e instanceof InvalidFormatError) return e
      if (e instanceof InvalidLengthError) return e
      return new InvalidFormatError(
        e instanceof Error ? e.message : String(e),
        { value: hex, expected: 'valid hex string', cause: e instanceof Error ? e : undefined }
      )
    }
  })
