/**
 * @fileoverview Hex toNumber function with Effect error handling.
 * Converts hex strings to numbers with proper validation.
 * @module voltaire-effect/primitives/Hex/toNumber
 * @since 0.0.1
 */

import { Hex as VoltaireHex, type HexType } from '@tevm/voltaire/Hex'
import { InvalidFormatError, ValidationError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Converts a Hex value to a number.
 *
 * @description
 * Parses a hex string as an unsigned integer. Returns an Effect that
 * fails with InvalidFormatError if the hex value is too large for
 * JavaScript's safe integer range (> Number.MAX_SAFE_INTEGER).
 *
 * For larger values, use {@link toBigInt} instead.
 *
 * @param {HexType | string} hex - Hex string to convert
 * @returns {Effect.Effect<number, InvalidFormatError>} Effect yielding the number on success,
 *   or failing with InvalidFormatError if the value exceeds safe integer range
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as Effect from 'effect/Effect'
 *
 * // Simple conversion
 * const num1 = await Effect.runPromise(Hex.toNumber('0xff')) // 255
 *
 * // Zero
 * const num2 = await Effect.runPromise(Hex.toNumber('0x00')) // 0
 *
 * // Handle overflow
 * const result = await Effect.runPromise(
 *   Hex.toNumber('0xffffffffffffffffffffffff').pipe(
 *     Effect.catchTag('InvalidFormatError', () => Effect.succeed(0))
 *   )
 * )
 * ```
 *
 * @throws {InvalidFormatError} When the hex value exceeds MAX_SAFE_INTEGER
 *
 * @see {@link fromNumber} - Create Hex from number
 * @see {@link toBigInt} - For values larger than MAX_SAFE_INTEGER
 *
 * @since 0.0.1
 */
export const toNumber = (hex: HexType | string): Effect.Effect<number, InvalidFormatError> =>
  Effect.try({
    try: () => VoltaireHex.toNumber(hex as HexType),
    catch: (e) => {
      if (e instanceof InvalidFormatError) return e
      if (e instanceof ValidationError) {
        return new InvalidFormatError(e.message, { value: hex, expected: 'hex within safe integer range', cause: e })
      }
      return new InvalidFormatError(
        e instanceof Error ? e.message : String(e),
        { value: hex, expected: 'hex within safe integer range', cause: e instanceof Error ? e : undefined }
      )
    }
  })
