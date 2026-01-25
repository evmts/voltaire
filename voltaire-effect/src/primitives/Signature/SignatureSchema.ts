/**
 * @fileoverview Effect Schema definitions for cryptographic signatures.
 *
 * Provides type-safe validation and transformation between hex/bytes representations
 * and the internal SignatureType. Supports secp256k1, p256, and ed25519 algorithms.
 *
 * @module SignatureSchema
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { SignatureSchema, SignatureFromBytesSchema } from 'voltaire-effect/primitives/Signature'
 *
 * // From hex string
 * const sig = S.decodeSync(SignatureSchema)('0x...')
 *
 * // From bytes
 * const sig2 = S.decodeSync(SignatureFromBytesSchema)(rawBytes)
 * ```
 */
import { Signature, type SignatureType } from '@tevm/voltaire/Signature'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Internal schema for validating SignatureType values.
 *
 * @description Validates that a value is a branded Uint8Array with a valid
 * algorithm property (secp256k1, p256, or ed25519).
 *
 * @internal
 * @since 0.0.1
 */
const SignatureTypeSchema = S.declare<SignatureType>(
  (u): u is SignatureType => {
    if (!(u instanceof Uint8Array)) return false
    const val = u as unknown as Record<string, unknown>
    return (
      'algorithm' in val &&
      (val.algorithm === 'secp256k1' || val.algorithm === 'p256' || val.algorithm === 'ed25519')
    )
  },
  { identifier: 'Signature' }
)

/**
 * Effect Schema for validating and parsing cryptographic signatures from hex strings.
 *
 * @description Transforms a hex-encoded signature string into a SignatureType.
 * Automatically detects the signature algorithm based on length and format:
 * - 65 bytes (130 hex chars): secp256k1 with recovery byte
 * - 64 bytes (128 hex chars): secp256k1/p256 without recovery
 * - 64 bytes: ed25519
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { SignatureSchema } from 'voltaire-effect/primitives/Signature'
 *
 * // Parse a secp256k1 signature
 * const sig = S.decodeSync(SignatureSchema)(
 *   '0x' + 'ab'.repeat(32) + 'cd'.repeat(32) + '1b'
 * )
 * console.log(sig.algorithm) // 'secp256k1'
 *
 * // Use in Effect pipelines
 * import * as Effect from 'effect/Effect'
 * const validated = yield* S.decode(SignatureSchema)(userInput)
 * ```
 *
 * @throws {ParseResult.Type} When the input is not a valid signature hex string
 *
 * @see {@link SignatureFromBytesSchema} - Schema for bytes input
 * @see {@link fromHex} - Effect-based alternative
 *
 * @since 0.0.1
 */
export const SignatureSchema: S.Schema<SignatureType, string> = S.transformOrFail(
  S.String,
  SignatureTypeSchema,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(Signature.fromHex(s))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (sig) => ParseResult.succeed(Signature.toHex(sig))
  }
).annotations({ identifier: 'SignatureSchema' })

/**
 * Effect Schema for validating and parsing cryptographic signatures from bytes.
 *
 * @description Transforms raw signature bytes into a SignatureType.
 * Automatically detects the signature algorithm based on length:
 * - 65 bytes: secp256k1 with recovery byte (r[32] + s[32] + v[1])
 * - 64 bytes: secp256k1/p256/ed25519 without recovery
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { SignatureFromBytesSchema } from 'voltaire-effect/primitives/Signature'
 *
 * // Parse from raw bytes
 * const sig = S.decodeSync(SignatureFromBytesSchema)(rawSignatureBytes)
 *
 * // Encode back to bytes
 * const bytes = S.encodeSync(SignatureFromBytesSchema)(sig)
 * ```
 *
 * @throws {ParseResult.Type} When the input bytes are not a valid signature
 *
 * @see {@link SignatureSchema} - Schema for hex string input
 * @see {@link fromBytes} - Effect-based alternative
 *
 * @since 0.0.1
 */
export const SignatureFromBytesSchema: S.Schema<SignatureType, Uint8Array> = S.transformOrFail(
  S.Uint8ArrayFromSelf,
  SignatureTypeSchema,
  {
    strict: true,
    decode: (bytes, _options, ast) => {
      try {
        return ParseResult.succeed(Signature.fromBytes(bytes))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, bytes, (e as Error).message))
      }
    },
    encode: (sig) => ParseResult.succeed(Signature.toBytes(sig))
  }
).annotations({ identifier: 'SignatureFromBytesSchema' })
