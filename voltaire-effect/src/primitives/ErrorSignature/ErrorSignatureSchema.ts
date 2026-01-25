import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'
import { ErrorSignature } from '@tevm/voltaire'

/**
 * Type representing a 4-byte Solidity error selector.
 * @since 0.0.1
 */
export type ErrorSignatureType = ReturnType<typeof ErrorSignature.from>

/**
 * Input types accepted for creating an ErrorSignature.
 * @since 0.0.1
 */
export type ErrorSignatureLike = Parameters<typeof ErrorSignature.from>[0]

const ErrorSignatureTypeSchema = S.declare<ErrorSignatureType>(
  (u): u is ErrorSignatureType => u instanceof Uint8Array && u.length === 4,
  { identifier: 'ErrorSignature' }
)

/**
 * Effect Schema for validating Solidity error selectors.
 * Accepts hex strings or Uint8Array and returns branded ErrorSignatureType.
 *
 * @example
 * ```typescript
 * import * as ErrorSignature from 'voltaire-effect/ErrorSignature'
 * import * as Schema from 'effect/Schema'
 *
 * const sig = Schema.decodeSync(ErrorSignature.ErrorSignatureSchema)('0x08c379a0')
 * ```
 * @since 0.0.1
 */
export const ErrorSignatureSchema: S.Schema<ErrorSignatureType, string | Uint8Array> = S.transformOrFail(
  S.Union(S.String, S.Uint8ArrayFromSelf),
  ErrorSignatureTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(ErrorSignature.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (sig) => ParseResult.succeed(ErrorSignature.toHex(sig))
  }
).annotations({ identifier: 'ErrorSignatureSchema' })
