/**
 * @fileoverview Hex right-pad function with Effect error handling.
 * Right-pads a hex string to a target byte size.
 * @module voltaire-effect/primitives/Hex/padRight
 * @since 0.0.1
 */

import { Hex as VoltaireHex, type HexType, InvalidSizeError } from '@tevm/voltaire/Hex'
import * as Effect from 'effect/Effect'

/**
 * Right-pad a hex string to target byte size with zeros.
 *
 * @description
 * Pads a hex string on the right with zeros to reach the target size in bytes.
 * If the hex is already at or exceeds the target size, it is returned unchanged.
 *
 * @param {HexType | string} hex - Hex string to pad
 * @param {number} targetSize - Target size in bytes (must be non-negative integer)
 * @returns {Effect.Effect<HexType, InvalidSizeError>} Effect yielding
 *   the padded hex string, or failing with error
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as Effect from 'effect/Effect'
 *
 * const padded = await Effect.runPromise(Hex.padRight('0x1234', 4)) // '0x12340000'
 * ```
 *
 * @since 0.0.1
 */
export const padRight = (
  hex: HexType | string,
  targetSize: number
): Effect.Effect<HexType, InvalidSizeError> =>
  Effect.try({
    try: () => VoltaireHex.padRight(hex as HexType, targetSize) as HexType,
    catch: (e) => {
      if (e instanceof InvalidSizeError) return e
      return new InvalidSizeError(
        e instanceof Error ? e.message : String(e),
        { value: hex, expected: 'non-negative integer size', cause: e instanceof Error ? e : undefined }
      )
    }
  })
