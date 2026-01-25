/**
 * @fileoverview Effect Schema for Hex string validation and transformation.
 * Provides type-safe parsing and encoding of hex strings using Effect Schema.
 * @module voltaire-effect/primitives/Hex/HexSchema
 * @since 0.0.1
 */

import { Hex as VoltaireHex, type HexType } from '@tevm/voltaire/Hex'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Internal schema for validating Hex strings.
 *
 * @description
 * Declares a schema that validates a value is a proper HexType.
 * Used internally by the public Schema for the transformation target.
 *
 * @internal
 */
const HexTypeSchema = S.declare<HexType>(
  (u): u is HexType => {
    if (typeof u !== 'string') return false
    try {
      VoltaireHex(u)
      return true
    } catch {
      return false
    }
  },
  { identifier: 'Hex' }
)

/**
 * Effect Schema for validating and transforming hex strings.
 *
 * @description
 * A bidirectional schema that transforms raw strings into branded HexType values.
 * Validates that the input is a valid hex string (with or without 0x prefix)
 * and normalizes it to a lowercase 0x-prefixed format.
 *
 * The schema can be used with all Effect Schema operations:
 * - `S.decodeSync` / `S.decode` for parsing
 * - `S.encodeSync` / `S.encode` for serialization
 * - `S.validate` for validation only
 * - `S.is` for type guards
 *
 * @type {S.Schema<HexType, string>}
 *
 * @example
 * ```ts
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/primitives/Hex'
 *
 * // Synchronous decoding
 * const hex = S.decodeSync(Schema)('0xdeadbeef') // HexType
 *
 * // Async decoding with Effect
 * import * as Effect from 'effect/Effect'
 * const hexEffect = S.decode(Schema)('deadbeef')
 * const result = await Effect.runPromise(hexEffect) // '0xdeadbeef'
 *
 * // Encoding back to string (identity for valid hex)
 * const encoded = S.encodeSync(Schema)(hex) // '0xdeadbeef'
 *
 * // Type guard
 * if (S.is(Schema)(value)) {
 *   // value is HexType
 * }
 *
 * // Error handling
 * try {
 *   S.decodeSync(Schema)('not hex')
 * } catch (e) {
 *   // ParseError with details
 * }
 * ```
 *
 * @throws {ParseError} When decoding fails due to invalid hex characters
 *   or malformed input
 *
 * @see {@link from} - Effect-based conversion function
 * @see {@link fromBytes} - Convert bytes to Hex
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<HexType, string> = S.transformOrFail(
  S.String,
  HexTypeSchema,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(VoltaireHex(s))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (h) => ParseResult.succeed(h)
  }
).annotations({ identifier: 'HexSchema' })
