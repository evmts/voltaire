/**
 * @fileoverview Hex XOR function with Effect error handling.
 * XORs two hex strings of the same length.
 * @module voltaire-effect/primitives/Hex/xor
 * @since 0.0.1
 */

import { Hex as VoltaireHex, type HexType } from '@tevm/voltaire/Hex'
import { InvalidFormatError, InvalidLengthError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * XOR two hex strings of the same length.
 *
 * @description
 * Performs a bitwise XOR operation on two hex strings. Both hex strings
 * must have the same byte length. Returns an Effect that fails if the
 * hex strings are invalid or have different lengths.
 *
 * @param {HexType} hex - First hex string
 * @param {HexType} other - Second hex string to XOR with
 * @returns {Effect.Effect<HexType, InvalidFormatError | InvalidLengthError>} Effect yielding
 *   the XOR result, or failing with error
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as Effect from 'effect/Effect'
 *
 * const result = await Effect.runPromise(Hex.xor('0x12', '0x34')) // '0x26'
 *
 * // Fails on length mismatch
 * const err = await Effect.runPromise(
 *   Hex.xor('0x1234', '0x12').pipe(
 *     Effect.catchTag('InvalidLengthError', () => Effect.succeed('length mismatch'))
 *   )
 * )
 * ```
 *
 * @since 0.0.1
 */
export const xor = (
  hex: HexType,
  other: HexType
): Effect.Effect<HexType, InvalidFormatError | InvalidLengthError> =>
  Effect.try({
    try: () => VoltaireHex.xor(hex, other),
    catch: (e) => {
      if (e instanceof InvalidFormatError) return e
      if (e instanceof InvalidLengthError) return e
      return new InvalidFormatError(
        e instanceof Error ? e.message : String(e),
        { value: hex, expected: 'valid hex strings of same length', cause: e instanceof Error ? e : undefined }
      )
    }
  })
