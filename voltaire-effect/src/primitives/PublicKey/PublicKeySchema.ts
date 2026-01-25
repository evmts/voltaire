/**
 * @fileoverview Effect Schema definitions for Ethereum public key validation and transformation.
 * Provides type-safe schemas for parsing public keys from hex strings, bytes, and compressed formats.
 * @module PublicKey/PublicKeySchema
 * @since 0.0.1
 */

import { PublicKey, _toHex, type PublicKeyType } from '@tevm/voltaire/PublicKey'
import * as Schema from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Converts a PublicKeyType to its hexadecimal string representation.
 *
 * @param pk - The public key to convert
 * @returns The hex string representation of the public key
 * @internal
 */
function toHexString(pk: PublicKeyType): string {
  return _toHex.call(pk)
}

/**
 * Internal schema declaration for validating PublicKeyType instances.
 * Ensures the value is a 64-byte Uint8Array (uncompressed format without prefix).
 *
 * @internal
 */
const PublicKeyTypeSchema = Schema.declare<PublicKeyType>(
  (u): u is PublicKeyType => u instanceof Uint8Array && u.length === 64,
  { identifier: 'PublicKey' }
)

/**
 * Effect Schema for validating and transforming public keys from hex strings.
 *
 * @description
 * Transforms a 128-character hex string (64 bytes) into an uncompressed
 * secp256k1 public key. The hex string should represent the x and y coordinates
 * concatenated (without the 0x04 prefix commonly used in SEC1 encoding).
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { PublicKeySchema } from 'voltaire-effect/primitives/PublicKey'
 *
 * // Decode from hex string
 * const publicKey = S.decodeSync(PublicKeySchema)('0x04...')
 *
 * // Encode back to hex string
 * const hex = S.encodeSync(PublicKeySchema)(publicKey)
 * ```
 *
 * @throws ParseResult.Type - When the input is not a valid public key hex string
 * @see {@link PublicKeyFromBytesSchema} for creating from raw bytes
 * @see {@link CompressedPublicKeySchema} for compressed format handling
 * @since 0.0.1
 */
export const PublicKeySchema: Schema.Schema<PublicKeyType, string> = Schema.transformOrFail(
  Schema.String,
  PublicKeyTypeSchema,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(PublicKey.from(s))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (pk) => ParseResult.succeed(toHexString(pk))
  }
)

/**
 * Effect Schema for validating public keys from raw bytes.
 *
 * @description
 * Accepts both compressed (33 bytes) and uncompressed (64 bytes) formats,
 * automatically decompressing compressed keys. This provides flexibility
 * when working with public keys from different sources that may use
 * different encoding formats.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { PublicKeyFromBytesSchema } from 'voltaire-effect/primitives/PublicKey'
 *
 * // Uncompressed 64-byte key
 * const pk1 = S.decodeSync(PublicKeyFromBytesSchema)(uncompressedBytes)
 *
 * // Compressed 33-byte key (auto-decompressed to 64 bytes)
 * const pk2 = S.decodeSync(PublicKeyFromBytesSchema)(compressedBytes)
 *
 * // Encode back to Uint8Array
 * const bytes = S.encodeSync(PublicKeyFromBytesSchema)(pk1)
 * ```
 *
 * @throws ParseResult.Type - When the input is not 33 or 64 bytes
 * @see {@link PublicKeySchema} for creating from hex strings
 * @see {@link CompressedPublicKeySchema} for explicit compression handling
 * @since 0.0.1
 */
export const PublicKeyFromBytesSchema: Schema.Schema<PublicKeyType, Uint8Array> = Schema.transformOrFail(
  Schema.Uint8ArrayFromSelf,
  PublicKeyTypeSchema,
  {
    strict: true,
    decode: (bytes, _options, ast) => {
      try {
        if (bytes.length === 33) {
          return ParseResult.succeed(PublicKey.decompress(bytes))
        }
        if (bytes.length === 64) {
          const hexStr = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
          return ParseResult.succeed(PublicKey.from('0x' + hexStr))
        }
        throw new Error(`Invalid public key length: ${bytes.length} bytes, expected 64 (uncompressed) or 33 (compressed)`)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, bytes, (e as Error).message))
      }
    },
    encode: (pk) => ParseResult.succeed(new Uint8Array(pk))
  }
)

/**
 * Effect Schema for handling compressed public keys.
 *
 * @description
 * Accepts both compressed (33 bytes) and uncompressed (64 bytes) formats,
 * always producing a compressed 33-byte output. Compressed keys use
 * SEC1 encoding where the first byte indicates the parity of the y-coordinate.
 *
 * This is useful for:
 * - Reducing storage size (33 bytes vs 64 bytes)
 * - Interoperability with systems that use compressed format
 * - Generating Ethereum addresses (which use keccak256 of uncompressed key)
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { CompressedPublicKeySchema } from 'voltaire-effect/primitives/PublicKey'
 *
 * // Compress an uncompressed key (64 -> 33 bytes)
 * const compressed = S.decodeSync(CompressedPublicKeySchema)(uncompressedBytes)
 * // compressed is 33 bytes
 *
 * // Pass-through already compressed key
 * const stillCompressed = S.decodeSync(CompressedPublicKeySchema)(compressed)
 *
 * // Encoding decompresses back to 64 bytes
 * const uncompressed = S.encodeSync(CompressedPublicKeySchema)(compressed)
 * ```
 *
 * @throws ParseResult.Type - When the input is not 33 or 64 bytes
 * @see {@link PublicKeyFromBytesSchema} for uncompressed format handling
 * @since 0.0.1
 */
export const CompressedPublicKeySchema: Schema.Schema<Uint8Array, Uint8Array> = Schema.transformOrFail(
  Schema.Uint8ArrayFromSelf,
  Schema.Uint8ArrayFromSelf,
  {
    strict: true,
    decode: (bytes, _options, ast) => {
      try {
        if (bytes.length === 64) {
          const hexStr = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
          const pk = PublicKey.from('0x' + hexStr)
          return ParseResult.succeed(PublicKey.compress(pk))
        }
        if (bytes.length === 33) {
          return ParseResult.succeed(bytes)
        }
        throw new Error(`Invalid public key length: ${bytes.length}`)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, bytes, (e as Error).message))
      }
    },
    encode: (compressed) => {
      try {
        const decompressed = PublicKey.decompress(compressed)
        return ParseResult.succeed(new Uint8Array(decompressed))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(Schema.Uint8ArrayFromSelf.ast, compressed, (e as Error).message))
      }
    }
  }
)
