/**
 * @fileoverview Effect Schema definitions for Ethereum private key validation and transformation.
 * Provides type-safe schemas for parsing private keys from hex strings and raw bytes.
 * @module PrivateKey/PrivateKeySchema
 * @since 0.0.1
 */

import { PrivateKey, _toHex, type PrivateKeyType } from '@tevm/voltaire/PrivateKey'
import * as Schema from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Converts a PrivateKeyType to its hexadecimal string representation.
 *
 * @param pk - The private key to convert
 * @returns The hex string representation of the private key
 * @internal
 */
function toHexString(pk: PrivateKeyType): string {
  return _toHex.call(pk)
}

/**
 * Internal schema declaration for validating PrivateKeyType instances.
 * Ensures the value is a 32-byte Uint8Array.
 *
 * @internal
 */
const PrivateKeyTypeSchema = Schema.declare<PrivateKeyType>(
  (u): u is PrivateKeyType => u instanceof Uint8Array && u.length === 32,
  { identifier: 'PrivateKey' }
)

/**
 * Effect Schema for validating and transforming private keys from hex strings.
 *
 * @description
 * Transforms a 64-character hex string (with or without 0x prefix) into a
 * 32-byte PrivateKeyType. Used for secure key handling with validation.
 * This schema is bidirectional - it can both decode hex strings to private keys
 * and encode private keys back to hex strings.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { PrivateKeySchema } from 'voltaire-effect/primitives/PrivateKey'
 *
 * // Decode from hex string
 * const privateKey = S.decodeSync(PrivateKeySchema)(
 *   '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
 * )
 *
 * // Encode back to hex string
 * const hex = S.encodeSync(PrivateKeySchema)(privateKey)
 * ```
 *
 * @throws ParseResult.Type - When the input is not a valid 64-character hex string
 * @see {@link PrivateKeyFromBytesSchema} for creating private keys from raw bytes
 * @since 0.0.1
 */
export const PrivateKeySchema: Schema.Schema<PrivateKeyType, string> = Schema.transformOrFail(
  Schema.String,
  PrivateKeyTypeSchema,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(PrivateKey.from(s))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (pk, _options, ast) => {
      try {
        return ParseResult.succeed(toHexString(pk))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, pk, (e as Error).message))
      }
    }
  }
)

/**
 * Effect Schema for validating and transforming private keys from raw bytes.
 *
 * @description
 * Transforms a 32-byte Uint8Array into a validated PrivateKeyType.
 * This is useful when working with binary data or when private keys
 * are stored in raw byte format rather than hex strings.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { PrivateKeyFromBytesSchema } from 'voltaire-effect/primitives/PrivateKey'
 *
 * // Create from 32-byte array
 * const bytes = new Uint8Array(32).fill(1)
 * const privateKey = S.decodeSync(PrivateKeyFromBytesSchema)(bytes)
 *
 * // Encode back to Uint8Array
 * const rawBytes = S.encodeSync(PrivateKeyFromBytesSchema)(privateKey)
 * ```
 *
 * @throws ParseResult.Type - When the input is not exactly 32 bytes
 * @see {@link PrivateKeySchema} for creating private keys from hex strings
 * @since 0.0.1
 */
export const PrivateKeyFromBytesSchema: Schema.Schema<PrivateKeyType, Uint8Array> = Schema.transformOrFail(
  Schema.Uint8ArrayFromSelf,
  PrivateKeyTypeSchema,
  {
    strict: true,
    decode: (bytes, _options, ast) => {
      try {
        return ParseResult.succeed(PrivateKey.fromBytes(bytes))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, bytes, (e as Error).message))
      }
    },
    encode: (pk, _options, ast) => {
      try {
        return ParseResult.succeed(new Uint8Array(pk))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, pk, (e as Error).message))
      }
    }
  }
)
