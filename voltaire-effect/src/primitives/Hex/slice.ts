/**
 * @fileoverview Hex slice function with Effect error handling.
 * Slices a hex string by byte indices.
 * @module voltaire-effect/primitives/Hex/slice
 * @since 0.0.1
 */

import { Hex as VoltaireHex, type HexType } from '@tevm/voltaire/Hex'
import { InvalidFormatError, InvalidLengthError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Slice a hex string by byte indices.
 *
 * @description
 * Extracts a portion of a hex string from start byte index to optional end
 * byte index. Returns an Effect that fails if the hex is invalid or indices
 * are out of bounds.
 *
 * @param {HexType} hex - Hex string to slice
 * @param {number} start - Start byte index (0-based)
 * @param {number} [end] - End byte index (optional, defaults to end of string)
 * @returns {Effect.Effect<HexType, InvalidFormatError | InvalidLengthError>} Effect yielding
 *   the sliced hex string, or failing with error
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as Effect from 'effect/Effect'
 *
 * // Slice from byte 1 to end
 * const sliced1 = await Effect.runPromise(Hex.slice('0x123456', 1)) // '0x3456'
 *
 * // Slice from byte 0 to byte 1
 * const sliced2 = await Effect.runPromise(Hex.slice('0x123456', 0, 1)) // '0x12'
 * ```
 *
 * @since 0.0.1
 */
export const slice = (
  hex: HexType,
  start: number,
  end?: number
): Effect.Effect<HexType, InvalidFormatError | InvalidLengthError> =>
  Effect.try({
    try: () => VoltaireHex.slice(hex, start, end),
    catch: (e) => {
      if (e instanceof InvalidFormatError) return e
      if (e instanceof InvalidLengthError) return e
      return new InvalidFormatError(
        e instanceof Error ? e.message : String(e),
        { value: hex, expected: 'valid hex string', cause: e instanceof Error ? e : undefined }
      )
    }
  })
