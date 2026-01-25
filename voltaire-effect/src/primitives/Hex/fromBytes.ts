/**
 * @fileoverview Infallible Hex creation from byte arrays.
 * Provides a guaranteed-success conversion from Uint8Array to Hex.
 * @module voltaire-effect/primitives/Hex/fromBytes
 * @since 0.0.1
 */

import { Hex as VoltaireHex, type HexType } from '@tevm/voltaire/Hex'
import * as Effect from 'effect/Effect'

/**
 * Creates a Hex string from a Uint8Array.
 *
 * @description
 * Converts a byte array to a hex string with 0x prefix. This operation is
 * infallible - any valid Uint8Array can be converted to hex. The resulting
 * Effect never fails (error type is `never`).
 *
 * Use this when you have raw bytes and need a hex representation. For
 * parsing hex strings that might be invalid, use {@link from} instead.
 *
 * @param {Uint8Array} bytes - Byte array to convert to hex
 * @returns {Effect.Effect<HexType, never>} Effect that always succeeds with the branded HexType.
 *   The hex string will have lowercase letters and a 0x prefix.
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as Effect from 'effect/Effect'
 *
 * // Basic conversion
 * const hex = Hex.fromBytes(new Uint8Array([0xde, 0xad, 0xbe, 0xef]))
 * const result = await Effect.runPromise(hex) // '0xdeadbeef'
 *
 * // Empty array produces '0x'
 * const empty = Hex.fromBytes(new Uint8Array([]))
 * const emptyResult = await Effect.runPromise(empty) // '0x'
 *
 * // Single byte
 * const single = Hex.fromBytes(new Uint8Array([255]))
 * const singleResult = await Effect.runPromise(single) // '0xff'
 *
 * // Chain with other Effects (never fails so easy to compose)
 * const pipeline = Effect.gen(function* () {
 *   const bytes = new Uint8Array([1, 2, 3])
 *   const hex = yield* Hex.fromBytes(bytes)
 *   return hex
 * })
 * ```
 *
 * @see {@link from} - Fallible conversion from string or bytes
 * @see {@link toBytes} - Convert Hex back to bytes
 *
 * @since 0.0.1
 */
export const fromBytes = (bytes: Uint8Array): Effect.Effect<HexType, never> =>
  Effect.succeed(VoltaireHex.fromBytes(bytes))
