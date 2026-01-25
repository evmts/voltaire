import { PrivateKey, _toHex, type PrivateKeyType } from '@tevm/voltaire/PrivateKey'
import * as Schema from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

function toHexString(pk: PrivateKeyType): string {
  return _toHex.call(pk)
}

const PrivateKeyTypeSchema = Schema.declare<PrivateKeyType>(
  (u): u is PrivateKeyType => u instanceof Uint8Array && u.length === 32,
  { identifier: 'PrivateKey' }
)

/**
 * Effect Schema for validating and transforming private keys from hex strings.
 *
 * Transforms a 64-character hex string (with or without 0x prefix) into a
 * 32-byte PrivateKeyType. Used for secure key handling with validation.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { PrivateKeySchema } from 'voltaire-effect/primitives/PrivateKey'
 *
 * const privateKey = S.decodeSync(PrivateKeySchema)(
 *   '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
 * )
 * ```
 *
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
    encode: (pk) => ParseResult.succeed(toHexString(pk))
  }
)

/**
 * Effect Schema for validating and transforming private keys from raw bytes.
 *
 * Transforms a 32-byte Uint8Array into a validated PrivateKeyType.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { PrivateKeyFromBytesSchema } from 'voltaire-effect/primitives/PrivateKey'
 *
 * const bytes = new Uint8Array(32).fill(1)
 * const privateKey = S.decodeSync(PrivateKeyFromBytesSchema)(bytes)
 * ```
 *
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
    encode: (pk) => ParseResult.succeed(new Uint8Array(pk))
  }
)
