/**
 * @fileoverview Hex fromBigInt function with Effect error handling.
 * Converts bigints to hex strings with proper validation.
 * @module voltaire-effect/primitives/Hex/fromBigInt
 * @since 0.0.1
 */

import { Hex as VoltaireHex, type HexType } from '@tevm/voltaire/Hex'
import { InvalidFormatError, ValidationError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Creates a Hex value from a bigint.
 *
 * @description
 * Converts a bigint to a branded HexType with 0x prefix. Optionally pads
 * the result to a specific byte size. Returns an Effect that fails with
 * InvalidFormatError if the input is invalid (e.g., negative or too large
 * for the specified size).
 *
 * @param {bigint} value - BigInt to convert to hex
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
 * const hex1 = await Effect.runPromise(Hex.fromBigInt(255n)) // '0xff'
 *
 * // Large values
 * const hex2 = await Effect.runPromise(Hex.fromBigInt(2n ** 256n - 1n))
 *
 * // With size padding
 * const hex3 = await Effect.runPromise(Hex.fromBigInt(255n, 32)) // 32-byte padded
 *
 * // Handle errors
 * const result = await Effect.runPromise(
 *   Hex.fromBigInt(-1n).pipe(
 *     Effect.catchTag('InvalidFormatError', (e) => Effect.succeed('0x00'))
 *   )
 * )
 * ```
 *
 * @throws {InvalidFormatError} When the input is negative or too large for size
 *
 * @see {@link from} - Create Hex from string or bytes
 * @see {@link toBigInt} - Convert Hex back to bigint
 *
 * @since 0.0.1
 */
export const fromBigInt = (value: bigint, size?: number): Effect.Effect<HexType, InvalidFormatError> =>
  Effect.try({
    try: () => VoltaireHex.fromBigInt(value, size),
    catch: (e) => {
      if (e instanceof InvalidFormatError) return e
      if (e instanceof ValidationError) {
        return new InvalidFormatError(e.message, { value, expected: 'valid bigint', cause: e })
      }
      return new InvalidFormatError(
        e instanceof Error ? e.message : String(e),
        { value, expected: 'valid bigint', cause: e instanceof Error ? e : undefined }
      )
    }
  })
