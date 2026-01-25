/**
 * @fileoverview Effect Schema for Bytes32 (32-byte) validation and transformation.
 * Provides type-safe parsing of 32-byte data from multiple input formats.
 * @module voltaire-effect/primitives/Bytes32/Bytes32Schema
 * @since 0.0.1
 */

import { Bytes32, type Bytes32Type } from '@tevm/voltaire/Bytes'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Internal schema for validating Bytes32.
 *
 * @description
 * Declares a schema that validates a value is a proper Bytes32Type
 * (Uint8Array with exactly 32 bytes). Used internally by the public
 * Schema for the transformation target.
 *
 * @internal
 */
const Bytes32TypeSchema = S.declare<Bytes32Type>(
  (u): u is Bytes32Type => {
    if (!(u instanceof Uint8Array)) return false
    return u.length === 32
  },
  { identifier: 'Bytes32' }
)

/**
 * Effect Schema for validating and parsing 32-byte data.
 *
 * @description
 * A bidirectional schema that transforms various input formats into branded
 * Bytes32Type. Validates that the result is exactly 32 bytes. Accepts:
 * - Hex string (64 hex chars + 0x prefix = 66 chars total)
 * - Uint8Array (must be exactly 32 bytes)
 * - bigint (will be left-padded to 32 bytes)
 * - number (will be left-padded to 32 bytes)
 *
 * 32-byte values are ubiquitous in Ethereum:
 * - Keccak256 hashes
 * - Storage slots
 * - Private keys
 * - Block hashes
 * - Transaction hashes
 *
 * The schema can be used with all Effect Schema operations:
 * - `S.decodeSync` / `S.decode` for parsing
 * - `S.encodeSync` / `S.encode` for serialization
 * - `S.validate` for validation only
 * - `S.is` for type guards
 *
 * @type {S.Schema<Bytes32Type, string | Uint8Array | bigint | number>}
 *
 * @example
 * ```typescript
 * import { Schema } from 'voltaire-effect/primitives/Bytes32'
 * import * as S from 'effect/Schema'
 *
 * // From 64-char hex string (+ 0x prefix)
 * const hash = S.decodeSync(Schema)(
 *   '0x' + 'ab'.repeat(32)
 * ) // Bytes32Type
 *
 * // From bigint (left-padded to 32 bytes)
 * const slot = S.decodeSync(Schema)(1n)
 * // Bytes32Type: 0x0000...0001
 *
 * // From number (left-padded to 32 bytes)
 * const index = S.decodeSync(Schema)(42)
 * // Bytes32Type: 0x0000...002a
 *
 * // From Uint8Array (must be 32 bytes)
 * const bytes = S.decodeSync(Schema)(new Uint8Array(32))
 * // Bytes32Type
 *
 * // Async decoding with Effect
 * import * as Effect from 'effect/Effect'
 * const hashEffect = S.decode(Schema)('0x' + 'ff'.repeat(32))
 * const result = await Effect.runPromise(hashEffect)
 *
 * // Type guard
 * if (S.is(Schema)(value)) {
 *   // value is Bytes32Type
 * }
 *
 * // Error handling for wrong length
 * try {
 *   S.decodeSync(Schema)('0xdeadbeef') // Only 4 bytes
 * } catch (e) {
 *   // ParseError: expected 32 bytes
 * }
 * ```
 *
 * @throws {ParseError} When decoding fails due to invalid input format
 *   or incorrect length (not 32 bytes)
 *
 * @see {@link from} - Effect-based conversion function
 * @see Bytes32Type - The branded output type
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<Bytes32Type, string | Uint8Array | bigint | number> = S.transformOrFail(
  S.Union(S.String, S.Uint8ArrayFromSelf, S.BigIntFromSelf, S.Number),
  Bytes32TypeSchema,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(Bytes32.Bytes32(s as string | Uint8Array | bigint | number))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (b, _options, ast) => {
      try {
        return ParseResult.succeed(b)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, b, (e as Error).message))
      }
    }
  }
).annotations({ identifier: 'Bytes32Schema' })
