/**
 * @fileoverview Hex concatenation function with Effect error handling.
 * Concatenates multiple hex strings into one.
 * @module voltaire-effect/primitives/Hex/concat
 * @since 0.0.1
 */

import { Hex as VoltaireHex, type HexType } from '@tevm/voltaire/Hex'
import { InvalidFormatError, InvalidLengthError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Concatenate multiple hex strings.
 *
 * @description
 * Combines multiple hex strings into a single hex string. Each input must be
 * a valid hex string with 0x prefix. Returns an Effect that fails if any
 * input is invalid.
 *
 * @param {...HexType[]} hexes - Hex strings to concatenate
 * @returns {Effect.Effect<HexType, InvalidFormatError | InvalidLengthError>} Effect yielding
 *   the concatenated hex string, or failing with InvalidFormatError/InvalidLengthError
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as Effect from 'effect/Effect'
 *
 * const result = await Effect.runPromise(
 *   Hex.concat('0x12', '0x34', '0x56')
 * ) // '0x123456'
 * ```
 *
 * @since 0.0.1
 */
export const concat = (
  ...hexes: HexType[]
): Effect.Effect<HexType, InvalidFormatError | InvalidLengthError> =>
  Effect.try({
    try: () => VoltaireHex.concat(...hexes),
    catch: (e) => {
      if (e instanceof InvalidFormatError) return e
      if (e instanceof InvalidLengthError) return e
      return new InvalidFormatError(
        e instanceof Error ? e.message : String(e),
        { value: hexes, expected: 'valid hex strings', cause: e instanceof Error ? e : undefined }
      )
    }
  })
