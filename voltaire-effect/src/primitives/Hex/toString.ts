/**
 * @fileoverview Hex toString function.
 * Converts hex strings to UTF-8 strings.
 * @module voltaire-effect/primitives/Hex/toString
 * @since 0.0.1
 */

import { Hex as VoltaireHex, type HexType } from '@tevm/voltaire/Hex'
import * as Effect from 'effect/Effect'

/**
 * Converts a Hex value to a UTF-8 string.
 *
 * @description
 * Decodes a hex string as UTF-8 text. The hex bytes are interpreted
 * as UTF-8 encoded characters. This operation is infallible - invalid
 * UTF-8 sequences are replaced with the Unicode replacement character.
 *
 * Note: This is different from simply coercing the hex to a string.
 * This function decodes the hex bytes as UTF-8 text content.
 *
 * @param {HexType | string} hex - Hex string to decode
 * @returns {Effect.Effect<string, never>} Effect that always succeeds with the decoded string
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as Effect from 'effect/Effect'
 *
 * // ASCII text
 * const str1 = await Effect.runPromise(Hex.toString('0x68656c6c6f'))
 * // 'hello'
 *
 * // Unicode text
 * const str2 = await Effect.runPromise(Hex.toString('0xf09fa68a'))
 * // '🦊'
 *
 * // Empty hex
 * const str3 = await Effect.runPromise(Hex.toString('0x'))
 * // ''
 *
 * // Use in pipeline
 * const pipeline = Effect.gen(function* () {
 *   const hex = yield* Hex.from('0x68656c6c6f')
 *   const text = yield* Hex.toString(hex)
 *   return text // 'hello'
 * })
 * ```
 *
 * @see {@link fromString} - Create Hex from UTF-8 string
 * @see {@link toBytes} - Convert to raw bytes instead of string
 *
 * @since 0.0.1
 */
// biome-ignore lint/suspicious/noShadowRestrictedNames: toString is intentional API name
export const toString = (hex: HexType | string): Effect.Effect<string, never> =>
  Effect.sync(() => VoltaireHex.toString(hex as HexType))
