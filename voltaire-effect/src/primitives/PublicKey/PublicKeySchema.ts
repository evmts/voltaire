import { PublicKey, _toHex, type PublicKeyType } from '@tevm/voltaire/PublicKey'
import * as Schema from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

function toHexString(pk: PublicKeyType): string {
  return _toHex.call(pk)
}

const PublicKeyTypeSchema = Schema.declare<PublicKeyType>(
  (u): u is PublicKeyType => u instanceof Uint8Array && u.length === 64,
  { identifier: 'PublicKey' }
)

/**
 * Effect Schema for validating and transforming public keys from hex strings.
 *
 * Transforms a 128-character hex string (64 bytes) into an uncompressed
 * secp256k1 public key.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { PublicKeySchema } from 'voltaire-effect/primitives/PublicKey'
 *
 * const publicKey = S.decodeSync(PublicKeySchema)('0x04...')
 * ```
 *
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
 * Accepts both compressed (33 bytes) and uncompressed (64 bytes) formats,
 * automatically decompressing compressed keys.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { PublicKeyFromBytesSchema } from 'voltaire-effect/primitives/PublicKey'
 *
 * // Uncompressed 64-byte key
 * const pk1 = S.decodeSync(PublicKeyFromBytesSchema)(uncompressedBytes)
 *
 * // Compressed 33-byte key (auto-decompressed)
 * const pk2 = S.decodeSync(PublicKeyFromBytesSchema)(compressedBytes)
 * ```
 *
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
 * Accepts both compressed (33 bytes) and uncompressed (64 bytes) formats,
 * always producing a compressed 33-byte output.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { CompressedPublicKeySchema } from 'voltaire-effect/primitives/PublicKey'
 *
 * // Compress an uncompressed key
 * const compressed = S.decodeSync(CompressedPublicKeySchema)(uncompressedBytes)
 * // compressed is 33 bytes
 * ```
 *
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
