/**
 * @fileoverview Bytes creation function with Effect error handling.
 * Converts various input formats to branded Bytes type with proper validation.
 * @module voltaire-effect/primitives/Bytes/from
 * @since 0.0.1
 */

import { Bytes as VoltaireBytes, type BytesType } from '@tevm/voltaire/Bytes'
import { InvalidRangeError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Creates Bytes from various input formats.
 *
 * @description
 * Converts input to a branded BytesType (Uint8Array). Accepts hex strings
 * (with 0x prefix), raw Uint8Array, or number arrays. Returns an Effect
 * that fails with InvalidRangeError if byte values are out of range.
 *
 * This is the primary constructor for Bytes values in the Effect-based API.
 * Never throws - all errors are captured in the Effect error channel.
 *
 * @param {Uint8Array | string | number[]} value - Input to convert:
 *   - `string`: Hex string with 0x prefix (e.g., '0xdeadbeef')
 *   - `Uint8Array`: Passthrough (wrapped as BytesType)
 *   - `number[]`: Array of byte values (0-255)
 * @returns {Effect.Effect<BytesType, InvalidRangeError>} Effect yielding the branded
 *   BytesType on success, or failing with InvalidRangeError if values are out of range
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Bytes from 'voltaire-effect/primitives/Bytes'
 *
 * // From hex string
 * const bytes1 = await Effect.runPromise(Bytes.from('0xdeadbeef'))
 * // Uint8Array([0xde, 0xad, 0xbe, 0xef])
 *
 * // From Uint8Array
 * const bytes2 = await Effect.runPromise(Bytes.from(new Uint8Array([1, 2, 3])))
 * // Uint8Array([1, 2, 3])
 *
 * // From number array
 * const bytes3 = await Effect.runPromise(Bytes.from([0xde, 0xad]))
 * // Uint8Array([0xde, 0xad])
 *
 * // Handle errors with Effect
 * const result = await Effect.runPromise(
 *   Bytes.from([256]).pipe( // 256 is out of range for a byte
 *     Effect.catchTag('InvalidRangeError', (e) =>
 *       Effect.succeed(new Uint8Array())
 *     )
 *   )
 * )
 *
 * // Use in Effect pipeline
 * const pipeline = Effect.gen(function* () {
 *   const bytes = yield* Bytes.from('0xdeadbeef')
 *   console.log(bytes.length) // 4
 *   return bytes
 * })
 * ```
 *
 * @throws {InvalidRangeError} When number array contains values outside 0-255 range
 *
 * @see {@link Schema} - Effect Schema for validation/parsing
 * @see BytesType - The branded output type
 *
 * @since 0.0.1
 */
export const from = (value: Uint8Array | string | number[]): Effect.Effect<BytesType, InvalidRangeError> =>
  Effect.try({
    try: () => VoltaireBytes(value),
    catch: (e) => e as InvalidRangeError
  })
