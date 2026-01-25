/**
 * @fileoverview Hex left-pad function with Effect error handling.
 * Left-pads a hex string to a target byte size.
 * @module voltaire-effect/primitives/Hex/pad
 * @since 0.0.1
 */

import { Hex as VoltaireHex, type HexType, InvalidSizeError, SizeExceededError } from '@tevm/voltaire/Hex'
import * as Effect from 'effect/Effect'

/**
 * Left-pad a hex string to target byte size with zeros.
 *
 * @description
 * Pads a hex string on the left with zeros to reach the target size in bytes.
 * If the hex is already the target size, it is returned unchanged.
 * Fails if the hex exceeds the target size.
 *
 * @param {HexType | string} hex - Hex string to pad
 * @param {number} targetSize - Target size in bytes (must be non-negative integer)
 * @returns {Effect.Effect<HexType, InvalidSizeError | SizeExceededError>} Effect yielding
 *   the padded hex string, or failing with error
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as Effect from 'effect/Effect'
 *
 * const padded = await Effect.runPromise(Hex.pad('0x1234', 4)) // '0x00001234'
 *
 * // Fails if hex exceeds target size
 * const result = await Effect.runPromise(
 *   Hex.pad('0x1234', 1).pipe(
 *     Effect.catchTag('SizeExceededError', () => Effect.succeed('too large'))
 *   )
 * )
 * ```
 *
 * @since 0.0.1
 */
export const pad = (
  hex: HexType | string,
  targetSize: number
): Effect.Effect<HexType, InvalidSizeError | SizeExceededError> =>
  Effect.try({
    try: () => VoltaireHex.pad(hex as HexType, targetSize) as HexType,
    catch: (e) => {
      if (e instanceof InvalidSizeError) return e
      if (e instanceof SizeExceededError) return e
      return new InvalidSizeError(
        e instanceof Error ? e.message : String(e),
        { value: hex, expected: `${targetSize} bytes or fewer`, cause: e instanceof Error ? e : undefined }
      )
    }
  })
