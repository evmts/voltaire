/**
 * @fileoverview Hex to bytes conversion function.
 * Converts hex strings to Uint8Array byte representation.
 * @module voltaire-effect/primitives/Hex/toBytes
 * @since 0.0.1
 */

import { Hex as VoltaireHex, type HexType } from '@tevm/voltaire/Hex'
import { InvalidFormatError, InvalidLengthError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Converts a Hex string to a Uint8Array.
 *
 * @description
 * Parses a hex string and returns the corresponding byte array. Each pair
 * of hex characters becomes one byte in the output array. The 0x prefix
 * is required but not included in the output.
 *
 * This operation can fail if the hex string has an odd number of characters
 * (excluding the prefix), as that would result in an incomplete final byte.
 *
 * @param {HexType | string} hex - Hex string to convert. Should have 0x prefix
 *   and an even number of hex characters.
 * @returns {Effect.Effect<Uint8Array, InvalidFormatError | InvalidLengthError>}
 *   Effect yielding Uint8Array on success, or failing with:
 *   - InvalidFormatError if the string contains invalid hex characters
 *   - InvalidLengthError if the string has odd length (incomplete byte)
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as Effect from 'effect/Effect'
 *
 * // Basic conversion
 * const bytes = await Effect.runPromise(Hex.toBytes('0xdeadbeef'))
 * // Uint8Array([0xde, 0xad, 0xbe, 0xef])
 *
 * // Empty hex produces empty array
 * const empty = await Effect.runPromise(Hex.toBytes('0x'))
 * // Uint8Array([])
 *
 * // Single byte
 * const single = await Effect.runPromise(Hex.toBytes('0xff'))
 * // Uint8Array([255])
 *
 * // Handle errors
 * const result = await Effect.runPromise(
 *   Hex.toBytes('0xabc').pipe( // Odd length - will fail
 *     Effect.catchAll((e) => Effect.succeed(new Uint8Array()))
 *   )
 * )
 *
 * // Round-trip conversion
 * const original = '0xdeadbeef'
 * const roundTrip = Effect.gen(function* () {
 *   const bytes = yield* Hex.toBytes(original)
 *   const hex = yield* Hex.fromBytes(bytes)
 *   return hex // '0xdeadbeef'
 * })
 * ```
 *
 * @throws {InvalidFormatError} When hex string contains non-hex characters
 * @throws {InvalidLengthError} When hex string has odd length (incomplete byte)
 *
 * @see {@link from} - Create Hex from string or bytes
 * @see {@link fromBytes} - Convert bytes back to Hex
 * @see {@link size} - Get byte size without converting
 *
 * @since 0.0.1
 */
export const toBytes = (hex: HexType | string): Effect.Effect<Uint8Array, InvalidFormatError | InvalidLengthError> =>
  Effect.try({
    try: () => VoltaireHex.toBytes(hex as HexType),
    catch: (e) => e as InvalidFormatError | InvalidLengthError
  })
