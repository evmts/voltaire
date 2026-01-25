import { Siwe, BrandedSiwe } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded type representing a Sign-In with Ethereum (SIWE) message.
 * Contains all fields required by EIP-4361.
 *
 * @since 0.0.1
 */
export type SiweMessageType = BrandedSiwe.SiweMessageType

/**
 * Result of validating a SIWE message.
 * Contains success/failure status and any validation errors.
 *
 * @since 0.0.1
 */
export type ValidationResult = BrandedSiwe.ValidationResult

/**
 * Effect Schema for SIWE message structure validation.
 * Validates all required and optional fields of a SIWE message.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { SiweMessageSchema } from 'voltaire-effect/primitives/Siwe'
 *
 * const validate = S.is(SiweMessageSchema)
 * const isValid = validate({
 *   domain: 'example.com',
 *   address: new Uint8Array(20),
 *   uri: 'https://example.com',
 *   version: '1',
 *   chainId: 1,
 *   nonce: 'abc123',
 *   issuedAt: new Date().toISOString()
 * })
 * ```
 *
 * @since 0.0.1
 */
export const SiweMessageSchema = S.Struct({
  domain: S.String,
  address: S.Uint8ArrayFromSelf,
  uri: S.String,
  version: S.String,
  chainId: S.Number,
  nonce: S.String,
  issuedAt: S.String,
  statement: S.optional(S.String),
  expirationTime: S.optional(S.String),
  notBefore: S.optional(S.String),
  requestId: S.optional(S.String),
  resources: S.optional(S.Array(S.String)),
}).annotations({ identifier: 'SiweMessage' })

/**
 * Effect Schema for parsing SIWE messages from their string representation.
 * Transforms a formatted SIWE string into a validated SiweMessageType.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/primitives/Siwe'
 *
 * const parse = S.decodeSync(Schema)
 * const message = parse(`example.com wants you to sign in...`)
 * ```
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<SiweMessageType, string> = S.transformOrFail(
  S.String,
  S.Any as S.Schema<SiweMessageType, SiweMessageType>,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(Siwe.parse(s))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (msg) => ParseResult.succeed(Siwe.format(msg))
  }
).annotations({ identifier: 'SiweSchema' })
