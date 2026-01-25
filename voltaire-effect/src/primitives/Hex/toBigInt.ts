/**
 * @fileoverview Hex toBigInt function with Effect error handling.
 * Converts hex strings to bigints with proper validation.
 * @module voltaire-effect/primitives/Hex/toBigInt
 * @since 0.0.1
 */

import { Hex as VoltaireHex, type HexType } from '@tevm/voltaire/Hex'
import { InvalidFormatError, ValidationError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Converts a Hex value to a bigint.
 *
 * @description
 * Parses a hex string as an unsigned bigint. Can handle arbitrarily
 * large values. Returns an Effect that fails with InvalidFormatError
 * if the hex string is malformed.
 *
 * @param {HexType | string} hex - Hex string to convert
 * @returns {Effect.Effect<bigint, InvalidFormatError>} Effect yielding the bigint on success,
 *   or failing with InvalidFormatError if the hex is malformed
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as Effect from 'effect/Effect'
 *
 * // Simple conversion
 * const num1 = await Effect.runPromise(Hex.toBigInt('0xff')) // 255n
 *
 * // Large values
 * const num2 = await Effect.runPromise(
 *   Hex.toBigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
 * ) // 2^256 - 1
 *
 * // Zero
 * const num3 = await Effect.runPromise(Hex.toBigInt('0x00')) // 0n
 *
 * // Empty hex
 * const num4 = await Effect.runPromise(Hex.toBigInt('0x')) // 0n
 * ```
 *
 * @throws {InvalidFormatError} When the hex string is malformed
 *
 * @see {@link fromBigInt} - Create Hex from bigint
 * @see {@link toNumber} - For values within safe integer range
 *
 * @since 0.0.1
 */
export const toBigInt = (hex: HexType | string): Effect.Effect<bigint, InvalidFormatError> =>
  Effect.try({
    try: () => VoltaireHex.toBigInt(hex as HexType),
    catch: (e) => {
      if (e instanceof InvalidFormatError) return e
      if (e instanceof ValidationError) {
        return new InvalidFormatError(e.message, { value: hex, expected: 'valid hex string', cause: e })
      }
      return new InvalidFormatError(
        e instanceof Error ? e.message : String(e),
        { value: hex, expected: 'valid hex string', cause: e instanceof Error ? e : undefined }
      )
    }
  })
